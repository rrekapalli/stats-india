import {
  Component,
  OnInit,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewChild,
  TemplateRef,
  ElementRef,
  HostBinding,
  inject,
  DestroyRef,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, distinctUntilChanged, take } from 'rxjs';
import { AgGridModule } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  InfiniteRowModelModule,
  IGetRowsParams
} from 'ag-grid-community';
import { Router, RouterLink } from '@angular/router';
import {
  STOCK_LIST_AG_GRID_ENV,
  StockListInstrumentFilterRequest,
  StockListInstrumentRow,
  StockListTick
} from './stock-list-ag-grid.token';

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DataViewModule } from 'primeng/dataview';
import { ScrollerModule } from "primeng/scroller";
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { StockListData } from './stock-list-chart-builder';
import { IWidget } from '../../entities/IWidget';

/**
 * Interface for selected stock data communication
 */
export interface SelectedStockData {
  id: string;
  symbol: string;
  name: string;
  lastPrice: number;
  priceChange: number;
  percentChange: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  industry?: string;
  sector?: string;
}

@Component({
  selector: 'app-stock-list-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    DividerModule,
    InputTextModule,
    ToggleSwitchModule,
    ScrollerModule,
    DataViewModule,
    ScrollPanelModule,
    TabsModule,
    TooltipModule,
    AgGridModule,
    RouterLink
  ],
  templateUrl: './stock-list-table.component.html',
  styleUrls: ['./stock-list-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockListTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() widget!: IWidget;
  @Input() stocks: StockListData[] = [];
  @Input() isLoadingStocks: boolean = false;
  @Input() selectedStockSymbol: string = ''; // Add input for selected stock
  @Input() showCurrencySymbol: boolean = true; // Control whether to show currency symbol (₹)
  @Output() stockSelected = new EventEmitter<SelectedStockData>();
  @Output() stockDoubleClicked = new EventEmitter<SelectedStockData>();
  @Output() refreshRequested = new EventEmitter<void>();

  @ViewChild('stockTooltipTemplate') stockTooltipTemplate!: TemplateRef<any>;

  // Search functionality
  searchQuery: string = '';
  isSearching: boolean = false;
  searchResults: StockListData[] = [];

  // Global filter for TreeTable
  globalFilterValue: string = '';

  // Tooltip functionality
  hoveredStock: StockListData | null = null;

  searchText: string = '';

  /** Filter list to symbols that appear in portfolio_trades (loaded via env). */
  holdingsFilterEnabled = false;
  holdingsSymbolsLoading = false;
  /** Cached distinct symbols; null = not loaded yet when Holdings is first enabled. */
  private portfolioTradeSymbols: string[] | null = null;

  // Filtered stocks for display
  filteredStocks: StockListData[] = [];

  // Footer statistics
  footerStats = {
    totalCount: 0,
    positiveCount: 0,
    negativeCount: 0,
    noChangeCount: 0
  };

  // Keep track of previous widget data for change detection
  private previousStocksLength: number = 0;
  private previousIsLoading: boolean = false;
  private previousUpdateTimestamp: number = 0;

  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly agGridEnv = inject(STOCK_LIST_AG_GRID_ENV, { optional: true });
  private readonly router = inject(Router, { optional: true });

  gridApi: GridApi | null = null;
  /** Native capture listener on .ag-root-wrapper — ag-grid-Angular rowClicked can fail to fire; this always runs first. */
  private agGridRootEl: HTMLElement | null = null;
  private readonly boundGridClickCapture = (e: MouseEvent) => this.onNativeGridClickCapture(e);

  private viewportScrollTimer: ReturnType<typeof setTimeout> | null = null;
  /** PrimeNG filtered list: scroll host for instrument-token viewport (aligns WS subs with visible rows). */
  private primeViewportScrollEl: HTMLElement | null = null;
  private primeViewportScrollTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly boundPrimeViewportScroll = () => this.schedulePrimeViewportScrollEmit();
  private tickSubscription: Subscription | null = null;
  private hasEmittedInitialSelection = false;
  private readonly searchDebounce$ = new Subject<string>();
  private prevStockListQueryKey: number | undefined;
  private primeLoadSeq = 0;
  isLoadingPrimeFilteredList = false;

  stockListDefaultColDef: ColDef = {
    resizable: true,
    sortable: true
  };

  stockListColumnDefs: ColDef[] = [];

  getRowId = (params: { data?: StockListInstrumentRow }) =>
    String(params.data?.instrumentToken ?? params.data?.tradingsymbol ?? '');

  /** POST /v1/instruments/filtered when Stock Insights provides STOCK_LIST_AG_GRID_ENV. */
  get useFilteredPostApi(): boolean {
    return !!this.widget?.config?.stockListUseFilteredApi && this.agGridEnv != null;
  }

  /** ag-grid infinite scroll (optional; default is PrimeNG + same POST API). */
  get useAgGrid(): boolean {
    return this.useFilteredPostApi && this.widget?.config?.stockListUseAgGrid === true;
  }

  get usePrimeFilteredPost(): boolean {
    return this.useFilteredPostApi && !this.useAgGrid;
  }

  get showHoldingsFilter(): boolean {
    return typeof this.agGridEnv?.getPortfolioTradeSymbols === 'function';
  }

  get displayTableLoading(): boolean {
    if (this.usePrimeFilteredPost) {
      return this.isLoadingPrimeFilteredList;
    }
    return this.isLoadingStocks;
  }

  get stockListRowClassRules(): Record<string, (params: { data?: StockListInstrumentRow }) => boolean> {
    const sym = (this.selectedStockSymbol || '').toUpperCase();
    return {
      'selected-stock-row': (params) =>
        ((params.data?.tradingsymbol || '').toUpperCase() === sym && !!sym)
    };
  }

  get symbolDeepLinkEnabled(): boolean {
    return this.widget?.config?.symbolDeepLink === true && !!this.router;
  }

  symbolDeepLinkLinkCommands(stock: StockListData): string[] {
    const sym = (stock.symbol || (stock as { tradingsymbol?: string }).tradingsymbol || '').trim();
    const tab = (this.widget?.config?.symbolDeepLinkDetailTab || 'overview').replace(/^\//, '');
    const base = (this.widget?.config?.symbolDeepLinkBasePath || '/stock-insights').replace(/\/$/, '') || '/stock-insights';
    return [base, sym, tab];
  }

  private navigateToSymbolDeepLink(symbol: string, replaceUrl = false): void {
    if (!this.router || !symbol?.trim()) {
      return;
    }
    const base = (this.widget?.config?.symbolDeepLinkBasePath || '/stock-insights').replace(/\/$/, '');
    const tab = (this.widget?.config?.symbolDeepLinkDetailTab || 'overview').replace(/^\//, '');
    this.router.navigateByUrl(`${base}/${encodeURIComponent(symbol.trim())}/${encodeURIComponent(tab)}`, {
      replaceUrl
    });
  }

  private buildAgGridNumericColumns(): ColDef[] {
    return [
      {
        headerName: 'Last Price',
        field: 'lastPrice',
        flex: 1,
        minWidth: 100,
        type: 'numericColumn',
        cellClass: 'text-right',
        valueFormatter: (p) =>
          p.value == null ? '—' : `₹${Number(p.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      {
        headerName: 'Change',
        field: 'priceChange',
        flex: 1,
        minWidth: 90,
        type: 'numericColumn',
        cellClass: 'text-right',
        valueFormatter: (p) => {
          if (p.value == null) return '—';
          const n = Number(p.value);
          const sign = n > 0 ? '+' : '';
          return `${sign}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },
        cellStyle: (p): Record<string, string> => {
          const v = p.value as number | undefined;
          if (v == null) return { textAlign: 'right' };
          if (v > 0) return { textAlign: 'right', color: '#16a34a', fontWeight: '600' };
          if (v < 0) return { textAlign: 'right', color: '#dc2626', fontWeight: '600' };
          return { textAlign: 'right', color: '#6b7280' };
        }
      },
      {
        headerName: 'Change %',
        field: 'percentChange',
        flex: 1,
        minWidth: 90,
        type: 'numericColumn',
        cellClass: 'text-right',
        valueFormatter: (p) => {
          if (p.value == null) return '—';
          const n = Number(p.value);
          const sign = n > 0 ? '+' : '';
          return `${sign}${n.toFixed(2)}%`;
        },
        cellStyle: (p): Record<string, string> => {
          const v = p.value as number | undefined;
          if (v == null) return { textAlign: 'right' };
          if (v > 0) return { textAlign: 'right', color: '#16a34a', fontWeight: '600' };
          if (v < 0) return { textAlign: 'right', color: '#dc2626', fontWeight: '600' };
          return { textAlign: 'right', color: '#6b7280' };
        }
      }
    ];
  }

  private rebuildAgGridColumnDefs(): void {
    if (!this.useAgGrid) {
      return;
    }
    const deep = this.symbolDeepLinkEnabled;
    const symbolCol: ColDef = {
      headerName: 'Symbol',
      field: 'tradingsymbol',
      flex: 1,
      minWidth: 100,
      cellClass: deep ? 'sl-symbol-cell sl-symbol-link-appearance' : 'sl-symbol-cell',
      tooltipField: 'tradingsymbol'
    };
    this.stockListColumnDefs = [symbolCol, ...this.buildAgGridNumericColumns()];
    if (this.gridApi) {
      this.gridApi.setGridOption('columnDefs', this.stockListColumnDefs);
      setTimeout(() => this.attachNativeGridClickCapture(), 0);
    }
  }

  // Scroll height for ag-grid (vh or 100% when fill parent); Prime list uses stockListBodyMaxRows cap when set
  public tableScrollHeight: string = '62vh';

  @HostBinding('style.--table-height-vh') get tableHeightVhCss(): number {
    return this.widget?.config?.tableHeightVh ?? 62;
  }

  @HostBinding('class.sl-stock-list-body-rows-cap')
  get stockListBodyRowsCapClass(): boolean {
    const n = this.widget?.config?.stockListBodyMaxRows;
    return !this.useAgGrid && n != null && n > 0;
  }

  @HostBinding('style.--sl-stock-list-body-rows')
  get stockListBodyRowsVar(): string | null {
    if (!this.stockListBodyRowsCapClass) {
      return null;
    }
    const n = this.widget?.config?.stockListBodyMaxRows;
    return n != null ? String(n) : null;
  }

  @HostBinding('style.--sl-stock-list-body-row-size')
  get stockListBodyRowSizeVar(): string | null {
    if (!this.stockListBodyRowsCapClass) {
      return null;
    }
    const rem = this.widget?.config?.stockListBodyRowRem;
    if (rem == null || rem <= 0) {
      return null;
    }
    return `${rem}rem`;
  }

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}
  
  /**
   * CRITICAL: Helper function to ensure stable identifiers in stock data
   * PrimeNG tracks rows by object reference, so we ensure each stock has a stable id
   * This prevents row recreation and preserves event bindings during data updates
   */
  private ensureStableIdentifiers(stocks: any[]): any[] {
    return stocks.map((stock, index) => ({
      ...stock,
      // Ensure stable identifier based on symbol (not timestamp) to prevent row recreation
      id: stock.id || stock.symbol || stock.tradingsymbol || `stock-${index}`
    }));
  }

  ngOnInit(): void {
    this.prevStockListQueryKey = this.widget?.data?.stockListQueryKey as number | undefined;
    this.updateStocksFromWidget();
    this.calculateScrollHeight();
    this.rebuildAgGridColumnDefs();
    if (this.useAgGrid) {
      this.searchDebounce$
        .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.hasEmittedInitialSelection = false;
          this.gridApi?.purgeInfiniteCache();
          this.loadFooterSummaryFromApi();
        });
    } else if (this.usePrimeFilteredPost && this.agGridEnv) {
      this.searchDebounce$
        .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.hasEmittedInitialSelection = false;
          this.loadPrimeFilteredList();
          this.loadFooterSummaryFromApi();
        });
      this.loadPrimeFilteredList();
      this.loadFooterSummaryFromApi();
      this.tickSubscription?.unsubscribe();
      this.tickSubscription = this.agGridEnv.stockTicks$.subscribe((tick: StockListTick) => {
        this.applyTickToPrimeList(tick);
      });
    } else {
      this.applyFilters();
    }
  }

  ngOnDestroy(): void {
    this.detachNativeGridClickCapture();
    this.detachPrimeViewportScrollListener();
    if (this.viewportScrollTimer) {
      clearTimeout(this.viewportScrollTimer);
      this.viewportScrollTimer = null;
    }
    this.tickSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    // Recalculate after view is initialized to get accurate height
    // Use longer delay to ensure gridster has finished layout
    setTimeout(() => {
      this.calculateScrollHeight();
      this.tryAttachPrimeViewportScrollListener();
      this.cdr.detectChanges();
    }, 500);
  }

  ngOnChanges(changes: any): void {
    this.updateStocksFromWidget();
    this.calculateScrollHeight();
    if (this.useAgGrid && this.gridApi && changes['widget']) {
      const qk = this.widget?.data?.stockListQueryKey as number | undefined;
      if (qk !== undefined && qk !== this.prevStockListQueryKey) {
        this.prevStockListQueryKey = qk;
        this.hasEmittedInitialSelection = false;
        this.gridApi.purgeInfiniteCache();
        this.loadFooterSummaryFromApi();
      }
    }
    if (this.usePrimeFilteredPost && changes['widget']) {
      const qk = this.widget?.data?.stockListQueryKey as number | undefined;
      if (qk !== undefined && qk !== this.prevStockListQueryKey) {
        this.prevStockListQueryKey = qk;
        this.hasEmittedInitialSelection = false;
        this.loadPrimeFilteredList();
        this.loadFooterSummaryFromApi();
      }
    }
    if (this.useAgGrid && this.gridApi && changes['selectedStockSymbol']) {
      this.gridApi.redrawRows();
    }
    if (this.useAgGrid && changes['widget']) {
      this.rebuildAgGridColumnDefs();
    }
    this.cdr.markForCheck();
  }

  /**
   * Table height: stockListTableFillParent → 100%; else tableHeightVh (62 stock-insights default).
   * Overall uses fill parent + stockListBodyMaxRows (fixed body row cap).
   */
  private calculateScrollHeight(): void {
    if (this.widget?.config?.stockListTableFillParent) {
      this.tableScrollHeight = '100%';
      return;
    }
    const vh = this.widget?.config?.tableHeightVh ?? 62;
    this.tableScrollHeight = `${vh}vh`;
  }

  /**
   * Update stocks data from widget.data
   * CRITICAL: Always trigger change detection to ensure event bindings remain active
   */
  private updateStocksFromWidget(): void {
    if (this.usePrimeFilteredPost) {
      if (this.widget?.data?.selectedStockSymbol !== undefined) {
        this.selectedStockSymbol = this.widget.data.selectedStockSymbol;
      }
      this.cdr.markForCheck();
      return;
    }

    if (this.useAgGrid) {
      if (this.widget?.data?.selectedStockSymbol !== undefined) {
        this.selectedStockSymbol = this.widget.data.selectedStockSymbol ?? '';
      }
      this.cdr.markForCheck();
      return;
    }

    if (this.widget?.data?.stocks && this.widget.data.stocks.length > 0) {
      // CRITICAL: Create new array reference with stable identifiers to trigger change detection
      // PrimeNG tracks rows by object reference, so stable IDs prevent row recreation
      const rawStocks = [...this.widget.data.stocks];
      this.stocks = this.ensureStableIdentifiers(rawStocks);
      this.isLoadingStocks = this.widget.data.isLoadingStocks || false;
      
      // Update selected stock symbol from widget data
      if (this.widget.data.selectedStockSymbol !== undefined) {
        this.selectedStockSymbol = this.widget.data.selectedStockSymbol;
      }
      
      // Always calculate footer statistics from stocks data
      // Use widget data if provided, but always recalculate noChangeCount to ensure accuracy
      if (this.widget.data.footerStats && 
          this.widget.data.footerStats.totalCount > 0) {
        // Use provided stats but recalculate noChangeCount to ensure it's correct
        const totalCount = this.widget.data.footerStats.totalCount || 0;
        const positiveCount = this.widget.data.footerStats.positiveCount || 0;
        const negativeCount = this.widget.data.footerStats.negativeCount || 0;
        // CRITICAL: Recalculate noChangeCount as total - positive - negative to ensure accuracy
        const noChangeCount = totalCount - positiveCount - negativeCount;
        
        this.footerStats = {
          totalCount: totalCount,
          positiveCount: positiveCount,
          negativeCount: negativeCount,
          noChangeCount: Math.max(0, noChangeCount) // Ensure non-negative
        };
      } else {
        // Calculate footer statistics from stocks data
        this.calculateFooterStats();
      }
      
      // Apply filters when stocks are updated
      this.applyFilters();
      
      // CRITICAL: Force change detection with OnPush strategy to ensure event bindings remain active
      this.cdr.markForCheck();
    } else if (!this.stocks || this.stocks.length === 0) {
      // Ensure stocks is initialized as empty array if no data
      this.stocks = [];
      this.filteredStocks = [];
      this.footerStats = { totalCount: 0, positiveCount: 0, negativeCount: 0, noChangeCount: 0 };
      // CRITICAL: Force change detection even when clearing data
      this.cdr.markForCheck();
    }
  }

  /**
   * Calculate footer statistics from stocks data
   */
  private calculateFooterStats(): void {
    if (!this.stocks || this.stocks.length === 0) {
      this.footerStats = { totalCount: 0, positiveCount: 0, negativeCount: 0, noChangeCount: 0 };
      return;
    }

    this.footerStats = this.countAdvancesDeclinesForList(this.stocks);
  }

  /**
   * Prime filtered API path: rows use the same in-memory list (and live ticks) as the table.
   * Summary API uses DB OHLC only, so tiles would diverge from row colors — derive tiles from
   * {@link filteredStocks} (search + holdings already reflected in {@link stocks}).
   */
  private syncFooterStatsFromFilteredStocks(): void {
    if (!this.usePrimeFilteredPost) {
      return;
    }
    const list = this.filteredStocks;
    if (!list.length) {
      this.footerStats = { totalCount: 0, positiveCount: 0, negativeCount: 0, noChangeCount: 0 };
      return;
    }
    this.footerStats = this.countAdvancesDeclinesForList(list);
  }

  private countAdvancesDeclinesForList(list: StockListData[]): {
    totalCount: number;
    positiveCount: number;
    negativeCount: number;
    noChangeCount: number;
  } {
    let positiveCount = 0;
    let negativeCount = 0;
    for (const stock of list) {
      const percentChange = stock.percentChange ?? 0;
      if (percentChange > 0) {
        positiveCount++;
      } else if (percentChange < 0) {
        negativeCount++;
      }
    }
    const noChangeCount = list.length - positiveCount - negativeCount;
    return {
      totalCount: list.length,
      positiveCount,
      negativeCount,
      noChangeCount: Math.max(0, noChangeCount),
    };
  }

  /**
   * Handle search text change
   */
  onSearchChange(): void {
    if (this.useAgGrid || this.usePrimeFilteredPost) {
      this.searchDebounce$.next(this.searchText);
      return;
    }
    this.applyFilters();
  }

  totalPct(count: number): string {
    if (!this.footerStats.totalCount) return '0';
    return ((count / this.footerStats.totalCount) * 100).toFixed(1);
  }

  onHoldingsFilterChange(enabled: boolean): void {
    this.holdingsFilterEnabled = enabled;
    if (!enabled) {
      this.refreshFilteredQueries();
      queueMicrotask(() => this.cdr.detectChanges());
      return;
    }
    if (this.portfolioTradeSymbols !== null) {
      this.refreshFilteredQueries();
      queueMicrotask(() => this.cdr.detectChanges());
      return;
    }
    const fn = this.agGridEnv?.getPortfolioTradeSymbols;
    if (!fn) {
      this.portfolioTradeSymbols = [];
      this.refreshFilteredQueries();
      queueMicrotask(() => this.cdr.detectChanges());
      return;
    }
    this.holdingsSymbolsLoading = true;
    this.refreshFilteredQueries();
    this.cdr.markForCheck();
    fn()
      .pipe(take(1))
      .subscribe({
        next: (syms) => {
          this.portfolioTradeSymbols = syms ?? [];
          this.holdingsSymbolsLoading = false;
          this.refreshFilteredQueries();
          this.cdr.markForCheck();
        },
        error: () => {
          this.portfolioTradeSymbols = [];
          this.holdingsSymbolsLoading = false;
          this.refreshFilteredQueries();
          this.cdr.markForCheck();
        }
      });
  }

  private refreshFilteredQueries(): void {
    this.hasEmittedInitialSelection = false;
    if (this.useAgGrid) {
      this.gridApi?.purgeInfiniteCache();
    } else if (this.usePrimeFilteredPost) {
      this.loadPrimeFilteredList();
    }
    this.loadFooterSummaryFromApi();
  }

  /**
   * Apply search filter (legacy Prime table path); sort by symbol A–Z.
   */
  private applyFilters(): void {
    let filtered = [...(this.stocks || [])];

    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(
        (stock) =>
          stock.symbol?.toLowerCase().includes(searchLower) ||
          stock.companyName?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      const aValue = (a.symbol || '').toLowerCase();
      const bValue = (b.symbol || '').toLowerCase();
      return aValue.localeCompare(bValue);
    });

    this.filteredStocks = filtered;
    this.syncFooterStatsFromFilteredStocks();
    if (this.usePrimeFilteredPost && !this.useAgGrid) {
      queueMicrotask(() => this.emitViewportTokensForFilteredSliceFromScroll());
    }
  }

  /**
   * Prime scrollable body: bind on each td so clicks always reach us (tr / pSelectableRow path is unreliable).
   */
  onStockListRowActivate(stock: StockListData, event: MouseEvent): void {
    const t = event.target as HTMLElement | null;
    if (t?.closest?.('a')) {
      return;
    }
    this.ngZone.run(() => this.onRowClick(stock));
  }

  /**
   * Search for stocks by symbol or company name
   */
  searchStocks(query: string): void {
    if (!query || query.trim() === '') {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;

    // Search within the loaded stocks
    const normalizedQuery = query.toLowerCase().trim();
    this.searchResults = this.stocks
      .filter(stock => 
        (stock.symbol?.toLowerCase().includes(normalizedQuery)) || 
        (stock.companyName?.toLowerCase().includes(normalizedQuery))
      )
      .map(stock => ({
        ...stock
      }));

    this.isSearching = false;
  }

  /**
   * Add a stock from search results to the current view
   */
  addStockFromSearch(stock: StockListData): void {
    // Check if the stock is already in the list
    const stockExists = this.stocks.some(item => item.symbol === stock.symbol);
    if (stockExists) {
      return;
    }

    // Add the stock to the list
    this.stocks.push(stock);

    // Clear search results
    this.searchResults = [];
    this.searchQuery = '';
  }


  /**
   * Handle row click event in the table
   * CRITICAL: Captures data immediately to prevent WebSocket update interference
   */
  onRowClick(rowData: any): void {
    if (!rowData) {
      return;
    }

    if (this.symbolDeepLinkEnabled) {
      const sym = rowData.symbol || rowData.tradingsymbol;
      if (sym) {
        this.ngZone.run(() => this.navigateToSymbolDeepLink(sym));
        this.cdr.markForCheck();
      }
      return;
    }

    // CRITICAL: Create deep copy of row data immediately to prevent WebSocket updates
    // from modifying the data while the click is being processed
    const capturedData = {
      id: rowData.id || rowData.symbol || 'unknown',
      symbol: rowData.symbol || rowData.tradingsymbol || '',
      tradingsymbol: rowData.tradingsymbol || rowData.symbol || '',
      name: rowData.companyName || rowData.name || rowData.symbol || '',
      lastPrice: typeof rowData.lastPrice === 'number' ? rowData.lastPrice : 0,
      priceChange: typeof rowData.priceChange === 'number' ? rowData.priceChange : 0,
      percentChange: typeof rowData.percentChange === 'number' ? rowData.percentChange : 0,
      volume: rowData.volume,
      dayHigh: rowData.dayHigh,
      dayLow: rowData.dayLow,
      industry: rowData.industry,
      sector: rowData.sector
    };
    
    // Transform the captured data to SelectedStockData format
    const selectedStockData: SelectedStockData = {
      id: capturedData.symbol || 'unknown',
      symbol: capturedData.symbol || '',
      name: capturedData.name || capturedData.symbol || '',
      lastPrice: capturedData.lastPrice,
      priceChange: capturedData.priceChange,
      percentChange: capturedData.percentChange,
      volume: capturedData.volume,
      dayHigh: capturedData.dayHigh,
      dayLow: capturedData.dayLow,
      industry: capturedData.industry,
      sector: capturedData.sector
    };
    
    // CRITICAL: Emit immediately with captured data before any change detection
    // This ensures the event uses stable data even if WebSocket updates occur
    this.stockSelected.emit(selectedStockData);
    
    // Use change detection to ensure event propagation with OnPush strategy
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /**
   * Handle row double-click event in the table
   */
  onRowDoubleClick(rowData: any): void {
    if (!rowData) {
      return;
    }

    if (this.symbolDeepLinkEnabled) {
      const sym = rowData.symbol || rowData.tradingsymbol;
      if (sym) {
        this.ngZone.run(() => this.navigateToSymbolDeepLink(sym));
        this.cdr.markForCheck();
      }
      return;
    }

    const symbol = rowData.symbol || rowData.tradingsymbol || '';
    const selectedStockData: SelectedStockData = {
      id: rowData.id || symbol || 'unknown',
      symbol,
      name: rowData.companyName || rowData.name || symbol || '',
      lastPrice: typeof rowData.lastPrice === 'number' ? rowData.lastPrice : 0,
      priceChange: typeof rowData.priceChange === 'number' ? rowData.priceChange : 0,
      percentChange: typeof rowData.percentChange === 'number' ? rowData.percentChange : 0,
      volume: rowData.volume,
      dayHigh: rowData.dayHigh,
      dayLow: rowData.dayLow,
      industry: rowData.industry,
      sector: rowData.sector
    };

    this.stockDoubleClicked.emit(selectedStockData);
    this.cdr.markForCheck();
  }

  /**
   * Refresh stocks data
   */
  refreshStocks(): void {
    this.refreshRequested.emit();
  }

  /**
   * Set the currently hovered stock for tooltip display
   */
  setHoveredStock(stock: StockListData): void {
    this.hoveredStock = stock;
  }

  /**
   * Clear the hovered stock when mouse leaves
   */
  clearHoveredStock(): void {
    this.hoveredStock = null;
  }

  /**
   * Check if the stock has numerical data to display in tooltip
   */
  hasNumericalData(stock: StockListData | null): boolean {
    if (!stock) return false;
    return (stock.volume !== undefined && stock.volume !== null) ||
           (stock.dayHigh !== undefined && stock.dayHigh !== null) ||
           (stock.dayLow !== undefined && stock.dayLow !== null) ||
           (stock.openPrice !== undefined && stock.openPrice !== null) ||
           (stock.previousClose !== undefined && stock.previousClose !== null);
  }

  onAgGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.rebuildAgGridColumnDefs();
    if (!this.agGridEnv) {
      return;
    }
    const datasource = this.createInfiniteDatasource();
    this.gridApi.setGridOption('datasource', datasource);
    this.loadFooterSummaryFromApi();
    setTimeout(() => this.gridApi?.sizeColumnsToFit({ defaultMinWidth: 80 }), 0);

    this.tickSubscription?.unsubscribe();
    this.tickSubscription = this.agGridEnv.stockTicks$.subscribe((tick: StockListTick) => {
      this.applyTickToGrid(tick);
    });

    setTimeout(() => this.attachNativeGridClickCapture(), 0);
    setTimeout(() => this.attachNativeGridClickCapture(), 200);
  }

  private attachNativeGridClickCapture(): void {
    if (!this.gridApi || !this.useAgGrid) {
      return;
    }
    const wrap = this.elementRef.nativeElement.querySelector('.ag-grid-stock-list-wrap');
    const root = wrap?.querySelector('.ag-root-wrapper') as HTMLElement | null;
    if (!root) {
      return;
    }
    if (this.agGridRootEl === root) {
      return;
    }
    this.detachNativeGridClickCapture();
    this.agGridRootEl = root;
    this.agGridRootEl.addEventListener('click', this.boundGridClickCapture, true);
  }

  private detachNativeGridClickCapture(): void {
    if (this.agGridRootEl) {
      this.agGridRootEl.removeEventListener('click', this.boundGridClickCapture, true);
      this.agGridRootEl = null;
    }
  }

  private onNativeGridClickCapture(e: MouseEvent): void {
    if (!this.gridApi) {
      return;
    }
    const target = e.target as HTMLElement | null;
    if (!target) {
      return;
    }
    const rowEl = target.closest('.ag-row') as HTMLElement | null;
    if (!rowEl) {
      return;
    }
    const rowId = rowEl.getAttribute('row-id');
    if (rowId == null || rowId === '') {
      return;
    }
    const node = this.gridApi.getRowNode(rowId);
    const data = node?.data as StockListInstrumentRow | undefined;
    if (!data?.tradingsymbol) {
      return;
    }
    e.stopPropagation();
    this.ngZone.run(() => this.applyInstrumentRowSelection(data));
  }

  /** Single path for row selection / deep-link navigation from ag-grid. */
  private applyInstrumentRowSelection(row: StockListInstrumentRow): void {
    if (this.symbolDeepLinkEnabled) {
      const sym = (row.tradingsymbol || '').trim();
      if (sym) {
        this.navigateToSymbolDeepLink(sym);
      }
      return;
    }
    this.onRowClick(this.mapInstrumentRowToRowData(row));
  }

  onAgGridBodyScroll(): void {
    if (this.viewportScrollTimer) {
      clearTimeout(this.viewportScrollTimer);
    }
    this.viewportScrollTimer = setTimeout(() => {
      this.viewportScrollTimer = null;
      const tokens = this.getViewportTokenSet();
      this.agGridEnv?.onViewportTokens(tokens);
    }, 150);
  }

  onAgSortChanged(): void {
    this.hasEmittedInitialSelection = false;
    this.gridApi?.purgeInfiniteCache();
  }

  private createInfiniteDatasource(): { getRows: (params: IGetRowsParams) => void } {
    const self = this;
    return {
      getRows(params: IGetRowsParams) {
        if (!self.agGridEnv) {
          params.failCallback();
          return;
        }
        const start = params.startRow;
        const end = params.endRow;
        const limit = Math.max(0, end - start);
        const sortModel = (params.sortModel || []).map((s) => ({
          colId: s.colId,
          sort: (s.sort === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        }));
        const request = self.buildStockListFilterRequestForApi(start, limit || 100, sortModel.length > 0 ? sortModel : undefined);
        self.agGridEnv.getFilteredInstrumentsPost(request).subscribe({
          next: (resp) => {
            const rows = resp.data || [];
            const total = resp.total ?? 0;
            if (start === 0 && rows.length > 0) {
              self.maybeEmitFirstSelection(rows);
            }
            params.successCallback(rows, total);
            self.cdr.markForCheck();
          },
          error: () => {
            params.failCallback();
          }
        });
      }
    };
  }

  private deepLinkedStockInsightsSymbol(): string | null {
    if (!this.router) {
      return null;
    }
    const path = this.router.url.split('?')[0];
    const m = path.match(/^\/stock-insights\/([^/]+)/);
    if (!m?.[1]) {
      return null;
    }
    try {
      const s = decodeURIComponent(m[1]).trim();
      return s || null;
    } catch {
      return m[1].trim() || null;
    }
  }

  private maybeEmitFirstSelection(rows: StockListInstrumentRow[]): void {
    if (this.hasEmittedInitialSelection || rows.length === 0) {
      return;
    }
    if (this.selectedStockSymbol) {
      this.hasEmittedInitialSelection = true;
      return;
    }
    this.hasEmittedInitialSelection = true;

    if (this.symbolDeepLinkEnabled && this.router) {
      const urlSym = this.deepLinkedStockInsightsSymbol();
      const firstSym = (rows[0].tradingsymbol || '').trim();
      if (urlSym && firstSym && urlSym.toUpperCase() !== firstSym.toUpperCase()) {
        return;
      }
      const sym = rows[0].tradingsymbol;
      if (sym) {
        this.ngZone.run(() => this.navigateToSymbolDeepLink(sym, true));
      }
      return;
    }

    this.onRowClick(this.mapInstrumentRowToRowData(rows[0]));
  }

  private mapInstrumentRowToRowData(row: StockListInstrumentRow): StockListData & { tradingsymbol?: string; name?: string } {
    const tok = row.instrumentToken != null ? String(row.instrumentToken) : undefined;
    return {
      id: tok ?? row.tradingsymbol,
      symbol: row.tradingsymbol,
      instrumentToken: tok,
      tradingsymbol: row.tradingsymbol,
      companyName: row.name,
      name: row.name,
      lastPrice: row.lastPrice ?? 0,
      priceChange: row.priceChange ?? 0,
      percentChange: row.percentChange ?? 0
    };
  }

  private loadFooterSummaryFromApi(): void {
    if (!this.agGridEnv) {
      return;
    }
    if (this.usePrimeFilteredPost) {
      return;
    }
    const request = this.buildStockListFilterRequestForApi();
    this.agGridEnv.getFilteredInstrumentsSummary(request).subscribe({
      next: (s) => {
        this.footerStats = {
          totalCount: s.total,
          positiveCount: s.advances,
          negativeCount: s.declines,
          noChangeCount: s.unchanged
        };
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  private buildStockListFilterRequestForApi(
    offset?: number,
    limit?: number,
    sortModel?: { colId: string; sort: 'asc' | 'desc' }[]
  ): StockListInstrumentFilterRequest {
    const filterModel: Record<string, unknown> = {};
    const q = this.searchText?.trim();
    if (q) {
      filterModel['tradingsymbol'] = {
        filterType: 'text',
        type: 'contains',
        filter: q
      };
    }
    const idx = this.widget?.data?.indexFilter as string | undefined;
    let tradingsymbolsIn: string[] | undefined;
    if (this.holdingsFilterEnabled) {
      if (this.portfolioTradeSymbols !== null) {
        tradingsymbolsIn = [...this.portfolioTradeSymbols];
      } else if (this.holdingsSymbolsLoading) {
        tradingsymbolsIn = [];
      }
    }
    const req: StockListInstrumentFilterRequest = {
      exchange: ['NSE'],
      filterModel: Object.keys(filterModel).length > 0 ? filterModel : undefined,
      ...(idx ? { index: idx } : {}),
      ...(tradingsymbolsIn !== undefined ? { tradingsymbolsIn } : {})
    };
    if (offset !== undefined) {
      req.offset = offset;
    }
    if (limit !== undefined) {
      req.limit = limit;
    }
    if (sortModel !== undefined) {
      req.sortModel = sortModel;
    }
    return req;
  }

  private loadPrimeFilteredList(): void {
    if (!this.agGridEnv || !this.usePrimeFilteredPost) {
      return;
    }
    const seq = ++this.primeLoadSeq;
    this.isLoadingPrimeFilteredList = true;
    this.cdr.markForCheck();
    const pageSize = 1000;
    let offset = 0;
    const allRows: StockListInstrumentRow[] = [];

    const loadPage = () => {
      const request = this.buildStockListFilterRequestForApi(offset, pageSize);
      this.agGridEnv!.getFilteredInstrumentsPost(request).subscribe({
        next: (resp) => {
          if (seq !== this.primeLoadSeq) {
            return;
          }
          const chunk = resp.data || [];
          allRows.push(...chunk);
          const total = resp.total ?? 0;
          if (chunk.length === pageSize && allRows.length < total) {
            offset += pageSize;
            loadPage();
          } else {
            this.finishPrimeFilteredLoad(allRows, seq);
          }
        },
        error: () => {
          if (seq !== this.primeLoadSeq) {
            return;
          }
          this.stocks = [];
          this.applyFilters();
          this.isLoadingPrimeFilteredList = false;
          this.cdr.markForCheck();
        }
      });
    };

    loadPage();
  }

  private finishPrimeFilteredLoad(rows: StockListInstrumentRow[], seq: number): void {
    if (seq !== this.primeLoadSeq) {
      return;
    }
    const mapped = rows.map((r) => this.mapInstrumentRowToRowData(r) as StockListData);
    this.stocks = this.ensureStableIdentifiers(mapped);
    this.applyFilters();
    this.isLoadingPrimeFilteredList = false;
    if (rows.length > 0) {
      this.maybeEmitFirstSelection(rows);
    }
    this.emitViewportTokensForFilteredSlice(0);
    queueMicrotask(() => {
      this.tryAttachPrimeViewportScrollListener();
      this.emitViewportTokensForFilteredSliceFromScroll();
    });
    this.cdr.markForCheck();
  }

  /**
   * Push up to 100 instrument tokens for the current filtered list window so KiteGateway
   * subscribes to the rows the user can see (sorted/filtered order), not the raw API page order.
   */
  private emitViewportTokensForFilteredSlice(startIndex: number): void {
    const list = this.filteredStocks;
    if (!list.length || !this.agGridEnv) {
      return;
    }
    const tokens = list
      .slice(startIndex, startIndex + 100)
      .map((s) => Number(s.instrumentToken))
      .filter((t) => !Number.isNaN(t) && t > 0);
    this.agGridEnv.onViewportTokens(tokens);
  }

  private emitViewportTokensForFilteredSliceFromScroll(): void {
    const list = this.filteredStocks;
    if (!list.length || !this.agGridEnv) {
      return;
    }
    let startIdx = 0;
    const host = this.primeViewportScrollEl;
    if (host) {
      const rowH = this.estimatePrimeRowPixelHeight(host);
      startIdx = Math.max(0, Math.floor(host.scrollTop / rowH));
    }
    this.emitViewportTokensForFilteredSlice(startIdx);
  }

  private estimatePrimeRowPixelHeight(host: HTMLElement): number {
    const tr = host.querySelector('tbody tr') as HTMLElement | null;
    if (tr?.offsetHeight) {
      return Math.max(28, tr.offsetHeight);
    }
    return 36;
  }

  private schedulePrimeViewportScrollEmit(): void {
    if (!this.usePrimeFilteredPost || this.useAgGrid) {
      return;
    }
    if (this.primeViewportScrollTimer) {
      clearTimeout(this.primeViewportScrollTimer);
    }
    this.primeViewportScrollTimer = setTimeout(() => {
      this.primeViewportScrollTimer = null;
      this.emitViewportTokensForFilteredSliceFromScroll();
    }, 150);
  }

  private tryAttachPrimeViewportScrollListener(): void {
    if (!this.usePrimeFilteredPost || this.useAgGrid) {
      return;
    }
    const host = this.elementRef.nativeElement.querySelector(
      '.table-container--flex .p-datatable-scrollable-body'
    ) as HTMLElement | null;
    if (!host || host === this.primeViewportScrollEl) {
      return;
    }
    this.detachPrimeViewportScrollListener();
    this.primeViewportScrollEl = host;
    this.primeViewportScrollEl.addEventListener('scroll', this.boundPrimeViewportScroll, { passive: true });
    queueMicrotask(() => this.emitViewportTokensForFilteredSliceFromScroll());
  }

  private detachPrimeViewportScrollListener(): void {
    if (this.primeViewportScrollEl) {
      this.primeViewportScrollEl.removeEventListener('scroll', this.boundPrimeViewportScroll);
      this.primeViewportScrollEl = null;
    }
    if (this.primeViewportScrollTimer) {
      clearTimeout(this.primeViewportScrollTimer);
      this.primeViewportScrollTimer = null;
    }
  }

  private applyTickToPrimeList(tick: StockListTick): void {
    if (!this.stocks?.length) {
      return;
    }
    const token = tick.instrumentToken != null ? String(tick.instrumentToken) : null;
    const sym = (tick.tradingsymbol || tick.symbol || '').toUpperCase();
    const idx = this.stocks.findIndex((s) => {
      if (token && s.instrumentToken && String(s.instrumentToken) === token) {
        return true;
      }
      return sym.length > 0 && (s.symbol || '').toUpperCase() === sym;
    });
    if (idx < 0) {
      return;
    }
    const s = this.stocks[idx];
    const updated: StockListData = {
      ...s,
      lastPrice: tick.lastPrice ?? s.lastPrice,
      priceChange: tick.priceChange ?? s.priceChange,
      percentChange: tick.percentChange ?? s.percentChange
    };
    this.stocks = [...this.stocks.slice(0, idx), updated, ...this.stocks.slice(idx + 1)];
    this.applyFilters();
    this.cdr.markForCheck();
  }

  private getViewportTokenSet(): number[] {
    if (!this.gridApi) {
      return [];
    }
    const first = this.gridApi.getFirstDisplayedRowIndex();
    const last = this.gridApi.getLastDisplayedRowIndex();
    if (first < 0 || last < 0) {
      return [];
    }
    const tokens: number[] = [];
    const maxRows = 100;
    let n = 0;
    for (let i = first; i <= last && n < maxRows; i++) {
      const node = this.gridApi.getDisplayedRowAtIndex(i);
      const d = node?.data as StockListInstrumentRow | undefined;
      const t = d?.instrumentToken != null ? Number(d.instrumentToken) : NaN;
      if (t > 0) {
        tokens.push(t);
        n++;
      }
    }
    return tokens;
  }

  private applyTickToGrid(tick: StockListTick): void {
    if (!this.gridApi) {
      return;
    }
    const tokenStr = tick.instrumentToken != null ? String(tick.instrumentToken) : null;
    let node = tokenStr ? this.gridApi.getRowNode(tokenStr) : undefined;
    if (!node && tick.tradingsymbol) {
      node = this.gridApi.getRowNode(tick.tradingsymbol);
    }
    if (!node && tick.symbol) {
      node = this.gridApi.getRowNode(tick.symbol);
    }
    if (!node?.data) {
      return;
    }
    const d = node.data as StockListInstrumentRow;
    const updated: StockListInstrumentRow = {
      ...d,
      lastPrice: tick.lastPrice ?? d.lastPrice,
      priceChange: tick.priceChange ?? d.priceChange,
      percentChange: tick.percentChange ?? d.percentChange
    };
    node.setData(updated);
    this.gridApi.refreshCells({ rowNodes: [node], force: true });
  }

  /**
   * Load sample data for testing
   */
  loadSampleData(): void {
    const sampleStocks: StockListData[] = [
      {
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries Limited',
        lastPrice: 2456.75,
        priceChange: 23.50,
        percentChange: 0.97,
        volume: 1234567,
        dayHigh: 2478.90,
        dayLow: 2445.20,
        openPrice: 2450.00,
        previousClose: 2433.25,
        industry: 'Oil & Gas',
        sector: 'Energy'
      },
      {
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services Limited',
        lastPrice: 3567.80,
        priceChange: -15.25,
        percentChange: -0.43,
        volume: 987654,
        dayHigh: 3590.00,
        dayLow: 3555.50,
        openPrice: 3580.00,
        previousClose: 3583.05,
        industry: 'Information Technology',
        sector: 'IT'
      },
      {
        symbol: 'INFY',
        companyName: 'Infosys Limited',
        lastPrice: 1456.30,
        priceChange: 8.75,
        percentChange: 0.60,
        volume: 2345678,
        dayHigh: 1465.00,
        dayLow: 1445.80,
        openPrice: 1450.00,
        previousClose: 1447.55,
        industry: 'Information Technology',
        sector: 'IT'
      },
      {
        symbol: 'HDFC',
        companyName: 'HDFC Bank Limited',
        lastPrice: 1678.90,
        priceChange: 12.40,
        percentChange: 0.74,
        volume: 1876543,
        dayHigh: 1685.50,
        dayLow: 1665.20,
        openPrice: 1670.00,
        previousClose: 1666.50,
        industry: 'Banking',
        sector: 'Financial Services'
      },
      {
        symbol: 'ICICI',
        companyName: 'ICICI Bank Limited',
        lastPrice: 987.65,
        priceChange: -5.30,
        percentChange: -0.53,
        volume: 3456789,
        dayHigh: 995.00,
        dayLow: 982.50,
        openPrice: 990.00,
        previousClose: 992.95,
        industry: 'Banking',
        sector: 'Financial Services'
      }
    ];

    // Update both component state and widget data to maintain synchronization
    this.stocks = sampleStocks;
    this.isLoadingStocks = false;
    
    // Also update the widget data if available
    if (this.widget?.data) {
      this.widget.data.stocks = sampleStocks;
      this.widget.data.isLoadingStocks = false;
    }
  }
}