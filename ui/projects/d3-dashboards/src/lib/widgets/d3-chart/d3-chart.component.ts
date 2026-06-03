import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  OnInit,
  OnChanges,
  SimpleChanges,
  Inject,
  DOCUMENT,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IWidget } from '../../entities/IWidget';
import { IFilterValues } from '../../entities/IFilterValues';
import type { ChartInteractionEvent, D3ChartSpec } from '../../chart-spec';
import { ChartRenderEngine } from '../../d3-core';
import { hideChartTooltip } from '../../d3-core/chart-html-tooltip';
import type { InteractionHandler } from '../../d3-core/interaction';

@Component({
  selector: 'vis-d3-chart',
  standalone: true,
  template: '<div class="d3-chart-host" #host></div>',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 120px;
      }
      .d3-chart-host {
        width: 100%;
        height: 100%;
        position: relative;
        pointer-events: auto;
        overflow: visible;
        box-sizing: border-box;
      }
      .d3-chart-host ::ng-deep svg {
        display: block;
        pointer-events: auto;
        overflow: visible;
      }
    `,
  ],
  imports: [CommonModule],
})
export class D3ChartComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() widget!: IWidget;
  /** @deprecated Use dataLoad output — kept for NgComponentOutlet legacy binding */
  @Input() onDataLoad?: EventEmitter<IWidget>;
  /** @deprecated Use filterUpdate output */
  @Input() onUpdateFilter?: EventEmitter<unknown>;
  @Output() dataLoad = new EventEmitter<IWidget>();
  @Output() filterUpdate = new EventEmitter<unknown>();
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  private isDestroyed = false;
  private htmlClassObserver: MutationObserver | null = null;
  private chartResizeObserver: ResizeObserver | null = null;
  private lastAppDark: boolean | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    const el = this.document.documentElement;
    this.lastAppDark = el.classList.contains('app-dark');
    this.htmlClassObserver = new MutationObserver(() => {
      const dark = el.classList.contains('app-dark');
      if (dark !== this.lastAppDark) {
        this.lastAppDark = dark;
        this.forceChartUpdate();
      }
      this.cdr.markForCheck();
    });
    this.htmlClassObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  ngAfterViewInit(): void {
    this.initChart();
    this.attachChartResizeObserver();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widget'] && !changes['widget'].firstChange && this.widget?.chartInstance) {
      const spec = this.chartSpec;
      if (spec?.chartType) {
        this.widget.chartInstance.update(spec);
      }
    }
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.detachChartResizeObserver();
    this.htmlClassObserver?.disconnect();
    hideChartTooltip();
    if (this.widget?.chartInstance) {
      try {
        this.widget.chartInstance.destroy();
      } catch {
        /* ignore */
      }
      this.widget.chartInstance = null;
    }
  }

  get chartSpec(): D3ChartSpec {
    return this.widget?.config?.options as D3ChartSpec;
  }

  private initChart(): void {
    if (this.isDestroyed || !this.hostRef?.nativeElement) {
      return;
    }
    const spec = this.chartSpec;
    if (!spec?.chartType) {
      return;
    }
    const onClick: InteractionHandler = (ev) => this.handleInteraction(ev);
    const onDblClick: InteractionHandler = (ev) => this.handleInteraction(ev);
    const handle = ChartRenderEngine.create(
      this.hostRef.nativeElement,
      spec,
      this.widget.config.renderMode,
      onClick,
      onDblClick
    );
    this.widget.chartInstance = handle;
    this.widget.config.events?.onChartOptions?.(this.widget, handle);
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.dataLoad.emit(this.widget);
        this.onDataLoad?.emit(this.widget);
        handle.resize();
      }
    }, 50);
  }

  private handleInteraction(ev: ChartInteractionEvent): void {
    this.ngZone.run(() => {
      if (ev.source === 'dblclick') {
        if (this.handleScatterSymbolDeepLink(ev)) {
          return;
        }
        if (this.widget?.config?.bankNavigationOnDblClick) {
          this.filterUpdate.emit({ bankNavigate: true, interaction: ev, widget: this.widget, value: ev.datum });
          this.onUpdateFilter?.emit({ bankNavigate: true, interaction: ev, widget: this.widget, value: ev.datum });
          return;
        }
        return;
      }
      this.emitFilterFromInteraction(ev);
    });
  }

  private scatterSymbolFromDatum(datum: unknown): string | null {
    if (!datum || typeof datum !== 'object' || Array.isArray(datum)) {
      return null;
    }
    const row = datum as { tradingsymbol?: string; name?: string; treemapOthersBucket?: boolean };
    if (row.treemapOthersBucket) {
      return null;
    }
    const sym = (row.tradingsymbol ?? row.name ?? '').trim();
    return sym || null;
  }

  private handleScatterSymbolDeepLink(ev: ChartInteractionEvent): boolean {
    if (ev.chartType !== 'scatter' && ev.chartType !== 'treemap') {
      return false;
    }
    const cfg = this.widget?.config;
    if (cfg?.symbolDeepLink === false) {
      return false;
    }
    const sym = this.scatterSymbolFromDatum(ev.datum);
    if (!sym) {
      return false;
    }
    const base = (cfg?.symbolDeepLinkBasePath || '/stock-insights').replace(/\/$/, '');
    const tab = (cfg?.symbolDeepLinkDetailTab || 'overview').replace(/^\//, '');
    const url = `${base}/${encodeURIComponent(sym)}/${tab}`;
    if (/^https?:\/\//i.test(base)) {
      window.location.href = url;
    } else {
      const path = url.startsWith('/') ? url : `/${url}`;
      window.location.href = `${window.location.origin}${path}`;
    }
    return true;
  }

  private emitFilterFromInteraction(ev: ChartInteractionEvent): void {
    const filterResult = this.createFilterValueFromClickData(ev.datum, ev);
    const filterList: IFilterValues[] = Array.isArray(filterResult)
      ? filterResult
      : filterResult
        ? [filterResult]
        : [];
    for (const fv of filterList) {
      fv['widgetId'] = this.widget.id;
      if (this.widget.config?.header?.title) {
        fv['widgetTitle'] = this.widget.config.header.title;
      }
    }
    const payload =
      filterList.length > 1
        ? { value: ev.datum, widget: this.widget, filterValues: filterList }
        : filterList.length === 1
          ? { value: ev.datum, widget: this.widget, filterValue: filterList[0] }
          : { value: ev.datum, widget: this.widget };
    this.filterUpdate.emit(payload);
    this.onUpdateFilter?.emit(payload);
    this.cdr.markForCheck();
  }

  private createFilterValueFromClickData(
    clickedData: unknown,
    event: ChartInteractionEvent
  ): IFilterValues | IFilterValues[] | null {
    const filterColumn = this.widget.config?.filterColumn || this.widget.config?.accessor || 'unknown';
    const chartType = event.chartType;

    if (chartType === 'histogram') {
      const row =
        clickedData && typeof clickedData === 'object' && !Array.isArray(clickedData)
          ? (clickedData as {
              x0?: number;
              x1?: number;
              length?: number;
              displayLabel?: string;
              filterColumn?: string;
            })
          : null;
      if (row?.x0 == null || row?.x1 == null) {
        return null;
      }
      const lo = Number(row.x0);
      const hi = Number(row.x1);
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
        return null;
      }
      const resolvedColumn = row.filterColumn || filterColumn;
      const displayLabel =
        row.displayLabel ?? `${lo.toLocaleString('en-IN')} – ${hi.toLocaleString('en-IN')}`;
      return {
        accessor: 'range',
        filterColumn: resolvedColumn,
        filterFrom: lo,
        filterTo: hi,
        category: `${lo}-${hi}`,
        value: `${lo}-${hi}`,
        displayLabel: String(displayLabel)
      };
    }

    if (chartType === 'bar' || chartType === 'horizontal-bar' || chartType.includes('bar')) {
      const row =
        clickedData && typeof clickedData === 'object' && !Array.isArray(clickedData)
          ? (clickedData as {
              name?: string;
              filterKey?: string;
              filterColumn?: string;
              displayLabel?: string;
            })
          : null;
      let categoryName: string;
      if (row?.name) {
        categoryName = String(row.filterKey ?? row.name);
      } else {
        const spec = this.chartSpec;
        const idx = event.dataIndex ?? 0;
        categoryName = spec.categories?.[idx] ?? String(clickedData ?? 'Unknown');
      }
      if (!categoryName) {
        return null;
      }
      const resolvedColumn = row?.filterColumn || filterColumn;
      const displayLabel = row?.displayLabel ?? row?.name ?? categoryName;
      return {
        accessor: 'category',
        filterColumn: resolvedColumn,
        category: categoryName,
        value: categoryName,
        displayLabel: String(displayLabel),
        seriesName: event.seriesName,
      };
    }

    if (!clickedData || typeof clickedData !== 'object') {
      return null;
    }

    if (chartType === 'pie' && 'name' in (clickedData as object)) {
      const row = clickedData as {
        name: string;
        value?: number;
        filterKey?: string;
        filterColumn?: string;
        displayLabel?: string;
      };
      const key = String(row.filterKey ?? row.name);
      const resolvedColumn = row.filterColumn || filterColumn;
      const displayLabel = row.displayLabel ?? row.name;
      return {
        accessor: 'category',
        filterColumn: resolvedColumn,
        category: key,
        value: key,
        displayLabel: String(displayLabel),
        percentage: String(row.value ?? 0),
      };
    }

    if (
      (chartType === 'treemap' ||
        chartType === 'sunburst' ||
        chartType === 'zoomable-sunburst' ||
        chartType === 'zoomable-icicle') &&
      clickedData &&
      typeof clickedData === 'object' &&
      'name' in (clickedData as object)
    ) {
      const node = clickedData as {
        name: string;
        value?: number;
        filterColumn?: string;
        treemapOthersBucket?: boolean;
      };
      if (node.treemapOthersBucket) {
        return null;
      }
      const nodeFilterColumn = node.filterColumn || filterColumn;
      const categoryName = String(node.name);
      if (!categoryName || categoryName === 'Instruments' || categoryName === 'root') {
        return null;
      }
      return {
        accessor: 'category',
        filterColumn: nodeFilterColumn,
        category: categoryName,
        value: categoryName,
        percentage: node.value != null ? String(node.value) : undefined,
      };
    }

    if (chartType === 'line' || chartType === 'area' || chartType === 'stacked-area') {
      return {
        accessor: 'series',
        filterColumn,
        series: event.seriesName ?? '',
        value: String((clickedData as { value?: unknown }).value ?? ''),
      };
    }

    if (chartType === 'scatter') {
      const d = clickedData as {
        value?: number[] | number;
        bankStmt?: { dayIso?: string };
        tradingsymbol?: string;
        name?: string;
      };
      if (d.bankStmt?.dayIso) {
        return {
          accessor: 'bankDay',
          filterColumn,
          bankDay: d.bankStmt.dayIso,
          value: d.bankStmt.dayIso,
          seriesName: event.seriesName,
        };
      }
      const col = filterColumn.toLowerCase();
      if (col.includes('symbol') || col.includes('tradingsymbol')) {
        const sym = (d.tradingsymbol ?? d.name ?? '').trim();
        if (sym) {
          return {
            accessor: 'category',
            filterColumn,
            category: sym,
            value: sym,
            seriesName: event.seriesName,
          };
        }
      }
      if (Array.isArray(d.value)) {
        return {
          accessor: 'coordinates',
          filterColumn,
          x: String(d.value[0]),
          y: String(d.value[1]),
          value: `(${d.value[0]}, ${d.value[1]})`,
          seriesName: event.seriesName,
        };
      }
      const symOnly = (d.tradingsymbol ?? d.name ?? '').trim();
      if (symOnly) {
        return {
          accessor: 'category',
          filterColumn,
          category: symOnly,
          value: symOnly,
          seriesName: event.seriesName,
        };
      }
    }

    if (chartType === 'heatmap' && clickedData && typeof clickedData === 'object' && !Array.isArray(clickedData)) {
      const cell = clickedData as { dayIso?: string; bankDay?: string; x?: string | number };
      const dayIso = String(cell.dayIso ?? cell.bankDay ?? '').trim();
      if (dayIso) {
        return { accessor: 'bankDay', filterColumn, bankDay: dayIso, value: dayIso };
      }
    }

    const keys = Object.keys(clickedData as object);
    if (keys.length > 0) {
      const key = keys[0];
      const val = (clickedData as Record<string, unknown>)[key];
      const fv: IFilterValues = {
        accessor: key,
        filterColumn,
        value: String(val),
        seriesName: event.seriesName,
      };
      (fv as Record<string, unknown>)[key] = val;
      return fv;
    }
    return null;
  }

  forceChartUpdate(): void {
    if (!this.isDestroyed && this.widget?.chartInstance) {
      this.widget.chartInstance.update(this.chartSpec);
    }
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  forceChartResize(): void {
    if (!this.isDestroyed && this.widget?.chartInstance) {
      this.widget.chartInstance.resize();
    }
  }

  private lastResizeW = 0;
  private lastResizeH = 0;

  private attachChartResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const host = this.hostRef.nativeElement;
    this.chartResizeObserver = new ResizeObserver(() => {
      if (this.isDestroyed) {
        return;
      }
      const { width, height } = host.getBoundingClientRect();
      if (width < 2 || height < 2) {
        return;
      }
      if (Math.abs(width - this.lastResizeW) < 4 && Math.abs(height - this.lastResizeH) < 4) {
        return;
      }
      this.lastResizeW = width;
      this.lastResizeH = height;
      requestAnimationFrame(() => this.forceChartResize());
    });
    this.chartResizeObserver.observe(host);
  }

  private detachChartResizeObserver(): void {
    this.chartResizeObserver?.disconnect();
    this.chartResizeObserver = null;
  }
}
