import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { KtdGridModule } from '@katoid/angular-grid-layout';
import type { KtdGridItemResizeEvent, KtdGridLayout } from '@katoid/angular-grid-layout';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IWidget } from '../entities/IWidget';
import { WidgetComponent } from '../widgets/widget/widget.component';
import { WidgetHeaderComponent } from '../widget-header/widget-header.component';
import { IFilterOptions } from '../entities/IFilterOptions';
import { IFilterValues } from '../entities/IFilterValues';
import { NgxPrintModule } from 'ngx-print';
import { ToastModule } from 'primeng/toast';
import { StandardDashboardBuilder } from './standard-dashboard-builder';
import { DashboardConfig } from './dashboard-container-builder';
import type { DashboardGridConfig } from '../grid/dashboard-grid.types';
import type { WidgetGridPosition } from '../grid/dashboard-grid.types';
import {
  applyKtdLayoutToWidgetsInPlace,
  widgetsToKtdLayout,
} from '../grid/layout-mapping';
import { DESKTOP_GRID_SETTINGS } from './dashboard-constants';

@Component({
  selector: 'vis-dashboard-container',
  standalone: true,
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    KtdGridModule,
    WidgetComponent,
    WidgetHeaderComponent,
    NgxPrintModule,
    ToastModule,
  ],
})
export class DashboardContainerComponent implements OnInit, OnChanges {
  @Input() widgets!: IWidget[];
  @Input() filterValues: IFilterValues[] = [];
  public container = DashboardContainerComponent;
  chartHeight: number = 300;
  readonly defaultChartHeight: number = 400;

  @Output() containerTouchChanged: EventEmitter<unknown> = new EventEmitter<unknown>();
  @Output() editModeStringChange: EventEmitter<string> = new EventEmitter<string>();
  @Output() changesMade: EventEmitter<string> = new EventEmitter<string>();
  @Output() filterValuesChanged: EventEmitter<IFilterValues[]> = new EventEmitter<IFilterValues[]>();
  @Output() chartInteraction: EventEmitter<unknown> = new EventEmitter<unknown>();
  @Output() onDataLoad: EventEmitter<IWidget> = new EventEmitter<IWidget>();
  @Output() onStockSelected: EventEmitter<unknown> = new EventEmitter<unknown>();
  @Output() onStockDoubleClicked: EventEmitter<unknown> = new EventEmitter<unknown>();

  availableDashboards: unknown[] = [];

  @Input() dashboardId: unknown;

  /** Passed to widget headers: cog menu (data view / export / …). Default on for existing dashboards. */
  @Input() widgetHeaderShowSettings = true;

  @Input() treemapViewMode: 'currentPrices' | 'marketCap' | null = null;
  @Input() treemapLiveTicksAvailable: boolean = false;
  @Output() treemapViewModeChange: EventEmitter<'currentPrices' | 'marketCap'> = new EventEmitter();

  initialWidgetData: unknown;
  @Input() isEditMode: boolean = false;

  onShowConfirmation: unknown = false;
  onShowNewDashboardDialog = false;

  static containerTouched: unknown;
  static editModeString = '';

  @ViewChild('dashboardContainer', { static: true }) dashboardContainer!: ElementRef<HTMLElement>;

  @Input() options: Partial<DashboardGridConfig> = {};
  public mergedOptions!: DashboardGridConfig;
  ktdLayout: KtdGridLayout = [];

  private widgetViewModes: Map<string, 'chart' | 'table'> = new Map();

  private dashboardBuilder: StandardDashboardBuilder = StandardDashboardBuilder.createStandard();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initializeDashboard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widgets'] && this.widgets?.length) {
      this.ktdLayout = widgetsToKtdLayout(this.widgets);
    }
    if (changes['options'] && this.mergedOptions) {
      this.mergedOptions = this.normalizeConfig({ ...this.mergedOptions, ...this.options });
    }
    if (changes['filterValues']) {
      this.filterValues = [...(this.filterValues ?? [])];
      this.dashboardBuilder.setFilterValues(this.filterValues);
      this.cdr.markForCheck();
    }
  }

  /**
   * Re-sync Katoid layout and ECharts after the grid host reaches a stable width.
   * Call explicitly from tabbed shells (e.g. Bank Accounts) — not wired globally, to avoid
   * resize/layout feedback loops on Overall / Stock Insights dashboards.
   */
  refreshGridLayout(): void {
    if (!this.widgets?.length) {
      return;
    }
    this.ktdLayout = widgetsToKtdLayout(this.widgets);
    for (const w of this.widgets) {
      try {
        w.chartInstance?.resize?.();
      } catch {
        /* chart may be mid-dispose */
      }
    }
    this.cdr.markForCheck();
  }

  /** Product shell uses fixed layouts; Katoid drag/resize is off (no layout editor). */
  get itemDraggable(): boolean {
    return false;
  }

  get itemResizable(): boolean {
    return false;
  }

  private normalizeConfig(config: Partial<DashboardGridConfig>): DashboardGridConfig {
    const rowH = config.rowHeight;
    return {
      cols: config.cols ?? DESKTOP_GRID_SETTINGS.MAX_COLS,
      rowHeight: typeof rowH === 'number' ? rowH : DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT,
      gap: config.gap ?? 2,
      compactType: config.compactType ?? 'vertical',
      preventCollision: config.preventCollision ?? true,
      compactOnPropsChange: config.compactOnPropsChange ?? false,
      draggable: config.draggable ?? true,
      resizable: config.resizable ?? true,
      scrollSpeed: config.scrollSpeed ?? 2,
      backgroundConfig: config.backgroundConfig,
      scrollableParent: config.scrollableParent,
      height: config.height ?? null,
      maxRows: config.maxRows,
      minRows: config.minRows,
      mobileBreakpoint: config.mobileBreakpoint,
      itemResizeCallback: config.itemResizeCallback,
      itemChangeCallback: config.itemChangeCallback,
      disableWarnings: config.disableWarnings,
    };
  }

  private initializeDashboard(): void {
    const dashboardConfig = this.dashboardBuilder
      .setWidgets(this.widgets || [])
      .setFilterValues(this.filterValues || [])
      .setDashboardId(String(this.dashboardId || ''))
      .setEditMode(this.isEditMode)
      .setChartHeight(this.chartHeight)
      .setDefaultChartHeight(this.defaultChartHeight)
      .setCustomConfig(this.options)
      .setItemResizeCallback(this.onWidgetResize.bind(this))
      .setItemChangeCallback(this.onWidgetChange.bind(this))
      .build();

    this.applyDashboardConfig(dashboardConfig);
  }

  private applyDashboardConfig(config: DashboardConfig): void {
    this.mergedOptions = this.normalizeConfig(config.config);
    this.widgets = config.widgets;
    this.filterValues = config.filterValues;
    this.dashboardId = config.dashboardId;
    this.isEditMode = config.isEditMode;
    this.chartHeight = config.chartHeight;
    this.ktdLayout = widgetsToKtdLayout(this.widgets);
  }

  public updateDashboardConfig(updates: Partial<DashboardConfig>): void {
    if (updates.config) {
      this.mergedOptions = this.normalizeConfig({ ...this.mergedOptions, ...updates.config });
    }

    if (updates.widgets) {
      this.widgets = updates.widgets;
    }

    if (updates.filterValues) {
      this.filterValues = updates.filterValues;
    }

    if (updates.dashboardId) {
      this.dashboardId = updates.dashboardId;
    }

    if (updates.isEditMode !== undefined) {
      this.isEditMode = updates.isEditMode;
    }

    if (updates.chartHeight) {
      this.chartHeight = updates.chartHeight;
    }

    this.dashboardBuilder = StandardDashboardBuilder.createStandard()
      .setWidgets(this.widgets)
      .setFilterValues(this.filterValues)
      .setDashboardId(String(this.dashboardId || ''))
      .setEditMode(this.isEditMode)
      .setChartHeight(this.chartHeight)
      .setDefaultChartHeight(this.defaultChartHeight);

    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public enableEditMode(): void {
    this.dashboardBuilder.enableEditMode();
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public disableEditMode(): void {
    this.dashboardBuilder.disableEditMode();
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public setResponsive(breakpoint: number = 640): void {
    this.dashboardBuilder.setResponsive(breakpoint);
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public setCompactLayout(): void {
    this.dashboardBuilder.setCompactLayout();
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public setSpaciousLayout(): void {
    this.dashboardBuilder.setSpaciousLayout();
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public setMobileOptimized(): void {
    this.dashboardBuilder.setMobileOptimized();
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public setDesktopOptimized(): void {
    this.dashboardBuilder.setDesktopOptimized();
    this.applyDashboardConfig(this.dashboardBuilder.build());
  }

  public getCurrentConfig(): DashboardConfig {
    return this.dashboardBuilder.build();
  }

  public getBuilder(): StandardDashboardBuilder {
    return this.dashboardBuilder;
  }

  async handleDataLoad(widget: IWidget): Promise<void> {
    if (this.filterValues && this.filterValues.length > 0) {
      this.applyFiltersToWidget(widget);
    }
    this.onDataLoad.emit(widget);
  }

  private applyFiltersToWidget(_widget: IWidget): void {}

  getFilterParams(): IFilterValues[] {
    return this.filterValues;
  }

  onUpdateWidget(_widget: IWidget): void {}

  onWidgetResize(item: WidgetGridPosition, itemComponent: unknown): void {
    this.mergedOptions?.itemResizeCallback?.(item, itemComponent);
  }

  onWidgetChange(item: WidgetGridPosition, itemComponent: unknown): void {
    this.mergedOptions?.itemChangeCallback?.(item, itemComponent);
  }

  onKtdLayoutUpdated(layout: KtdGridLayout): void {
    this.ktdLayout = layout.map((i) => ({ ...i }));
    applyKtdLayoutToWidgetsInPlace(this.ktdLayout, this.widgets);
    DashboardContainerComponent.containerTouched = true;
    DashboardContainerComponent.editModeString = '[Edit Mode - Pending Changes]';
    this.updateString(DashboardContainerComponent.editModeString);
  }

  onKtdGridItemResize(ev: KtdGridItemResizeEvent): void {
    const w = this.widgets.find((x) => x.id === ev.gridItemRef.id);
    if (w) {
      this.onWidgetResize(w.position, ev.gridItemRef);
    }
  }

  updateString(editModeString: string): void {
    this.editModeStringChange.emit(editModeString);
  }

  getEditModeString(_editModeString: unknown): string {
    return DashboardContainerComponent.editModeString;
  }

  onUpdateFilter($event: any): void {
    if ($event?.bankNavigate) {
      this.chartInteraction.emit($event);
      return;
    }
    const filterWidget = this.widgets.find((w) => w.config?.component === 'filter');

    let filterOptions: IFilterOptions | null = null;
    if (filterWidget) {
      const newFilterWidget = { ...filterWidget };

      if (!newFilterWidget.config) {
        newFilterWidget.config = {
          options: { values: [] } as IFilterOptions,
        };
      } else if (!newFilterWidget.config.options) {
        newFilterWidget.config.options = { values: [] } as IFilterOptions;
      }

      filterOptions = newFilterWidget.config.options as IFilterOptions;
      if (!filterOptions.values) {
        filterOptions.values = [];
      }
    }

    if (!this.filterValues) {
      this.filterValues = [];
    }

    if (Array.isArray($event)) {
      if (filterOptions) {
        filterOptions.values = $event;
      }
      this.filterValues = [...$event];

      if ($event.length === 0) {
        this.dashboardBuilder.setFilterValues([]);
        this.filterValues = [];
        if (filterOptions) {
          filterOptions.values = [];
        }
      }
    } else if (
      $event &&
      $event.widget &&
      Array.isArray($event.filterValues) &&
      $event.filterValues.length > 0
    ) {
      for (const finalFilterValue of $event.filterValues as IFilterValues[]) {
        if (finalFilterValue?.accessor && finalFilterValue['value'] != null && finalFilterValue['value'] !== '') {
          if ($event.widget.id) {
            finalFilterValue['widgetId'] = $event.widget.id as string;
          }
          if ($event.widget.config?.header?.title) {
            finalFilterValue['widgetTitle'] = $event.widget.config.header.title;
          }
          if (filterOptions) {
            filterOptions.values.push(finalFilterValue);
          }
          this.filterValues = [...this.filterValues, finalFilterValue];
        }
      }
    } else if ($event?.widget && ($event.filterValue || $event.value != null)) {
      const clickedData = $event.value;
      const sourceWidget = $event.widget;
      const filterValue = $event.filterValue;

      let finalFilterValue: any = filterValue;

      if (!finalFilterValue && clickedData && typeof clickedData === 'object') {
        const filterColumn = sourceWidget.config?.filterColumn || sourceWidget.config?.accessor || 'unknown';

        if (clickedData.name) {
          finalFilterValue = {
            accessor: 'category',
            filterColumn: filterColumn,
            category: clickedData.name,
            value: clickedData.value || clickedData.name,
          };
        } else if (clickedData.seriesName) {
          finalFilterValue = {
            accessor: 'series',
            filterColumn: filterColumn,
            series: clickedData.seriesName,
            value: clickedData.value || clickedData.seriesName,
          };
        } else {
          const keys = Object.keys(clickedData);
          if (keys.length > 0) {
            const key = keys[0];
            finalFilterValue = {
              accessor: key,
              filterColumn: filterColumn,
              [key]: (clickedData as any)[key],
              value: (clickedData as any)[key],
            };
          }
        }

        if (sourceWidget.config?.header?.title) {
          finalFilterValue.widgetTitle = sourceWidget.config.header.title;
        }
        if (sourceWidget.id) {
          finalFilterValue.widgetId = sourceWidget.id;
        }
      }

      if (
        finalFilterValue?.accessor &&
        finalFilterValue['value'] != null &&
        finalFilterValue['value'] !== ''
      ) {
        if (filterOptions) {
          filterOptions.values.push(finalFilterValue);
        }
        this.filterValues = [...this.filterValues, finalFilterValue];
      }
    }

    this.dashboardBuilder.setFilterValues(this.filterValues);
    this.filterValuesChanged.emit(this.filterValues);
    this.cdr.markForCheck();
  }

  onDashboardSelectionChanged(_$event: unknown): void {
    return;
  }

  onDeleteWidget(widget: IWidget): void {
    this.widgets.splice(this.widgets.indexOf(widget), 1);
    this.ktdLayout = widgetsToKtdLayout(this.widgets);
  }

  public calculateChartHeight(
    cols: number,
    rows: number,
    flag: boolean = false,
    baseHeight: number = this.defaultChartHeight
  ): number {
    return StandardDashboardBuilder.calculateChartHeight(cols, rows, flag, baseHeight);
  }

  public calculateMapCenter(cols: number, rows: number): number[] {
    return StandardDashboardBuilder.calculateMapCenter(cols, rows);
  }

  public calculateMapZoom(cols: number, rows: number): number {
    return StandardDashboardBuilder.calculateMapZoom(cols, rows);
  }

  getWidgetViewMode(widgetId: string): 'chart' | 'table' {
    return this.widgetViewModes.get(widgetId) || 'chart';
  }

  onToggleViewMode(event: { widgetId: string; viewMode: 'chart' | 'table' }): void {
    this.widgetViewModes.set(event.widgetId, event.viewMode);
  }

  handleStockSelected(event: unknown): void {
    this.onStockSelected.emit(event);
  }

  handleStockDoubleClicked(event: unknown): void {
    this.onStockDoubleClicked.emit(event);
  }
}
