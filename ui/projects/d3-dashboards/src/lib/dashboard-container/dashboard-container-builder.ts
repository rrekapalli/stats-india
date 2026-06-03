import type { DashboardGridConfig, WidgetGridPosition } from '../grid/dashboard-grid.types';
import { DashboardDisplayGrid } from '../grid/dashboard-grid.types';
import { IWidget } from '../entities/IWidget';
import { IFilterValues } from '../entities/IFilterValues';

/**
 * Abstract base class for Dashboard Container builders (KTD grid).
 */
export abstract class DashboardContainerBuilder<T extends DashboardGridConfig = DashboardGridConfig> {
  protected containerConfig: Partial<T>;
  protected widgets: IWidget[] = [];
  protected filterValues: IFilterValues[] = [];
  protected dashboardId: string = '';
  protected isEditMode: boolean = false;
  protected chartHeight: number = 300;
  protected defaultChartHeight: number = 400;

  protected constructor() {
    this.containerConfig = this.getDefaultConfig();
  }

  protected abstract getDefaultConfig(): Partial<T>;

  /** Legacy no-op (Gridster grid types); KTD uses `cols` + `rowHeight` only. */
  setGridType(_gridType: unknown): this {
    return this;
  }

  /** Maps to `KtdGridBackgroundCfg.show`. */
  setDisplayGrid(mode: (typeof DashboardDisplayGrid)[keyof typeof DashboardDisplayGrid]): this {
    const show = mode === DashboardDisplayGrid.None ? 'never' : 'always';
    this.containerConfig.backgroundConfig = {
      ...(this.containerConfig.backgroundConfig || {}),
      show,
    };
    return this;
  }

  /** Legacy; outer margin not modeled on KTD grid (handled by container CSS). */
  setOuterMargin(_outerMargin: boolean): this {
    return this;
  }

  setDraggable(enabled: boolean, _options?: { dragIgnoreFrom?: string }): this {
    (this.containerConfig as Partial<DashboardGridConfig>).draggable = enabled;
    return this;
  }

  setResizable(enabled: boolean, _options?: unknown): this {
    (this.containerConfig as Partial<DashboardGridConfig>).resizable = enabled;
    return this;
  }

  setMaxCols(maxCols: number): this {
    (this.containerConfig as Partial<DashboardGridConfig>).cols = maxCols;
    return this;
  }

  setMinCols(_minCols: number): this {
    return this;
  }

  setMaxRows(maxRows: number): this {
    this.containerConfig.maxRows = maxRows;
    return this;
  }

  setMinRows(minRows: number): this {
    this.containerConfig.minRows = minRows;
    return this;
  }

  setFixedColWidth(_width: number): this {
    return this;
  }

  setFixedRowHeight(height: number): this {
    (this.containerConfig as Partial<DashboardGridConfig>).rowHeight = height;
    return this;
  }

  setEmptyCellConfig(_config: {
    enableEmptyCellClick?: boolean;
    enableEmptyCellContextMenu?: boolean;
    enableEmptyCellDrop?: boolean;
    enableEmptyCellDrag?: boolean;
    emptyCellDragMaxCols?: number;
    emptyCellDragMaxRows?: number;
  }): this {
    return this;
  }

  setIgnoreMarginInRow(_ignore: boolean): this {
    return this;
  }

  setMobileBreakpoint(breakpoint: number): this {
    this.containerConfig.mobileBreakpoint = breakpoint;
    return this;
  }

  setWidgets(widgets: IWidget[]): this {
    this.widgets = widgets;
    return this;
  }

  addWidget(widget: IWidget): this {
    this.widgets.push(widget);
    return this;
  }

  setFilterValues(filterValues: IFilterValues[]): this {
    this.filterValues = filterValues;
    return this;
  }

  setDashboardId(dashboardId: string): this {
    this.dashboardId = dashboardId;
    return this;
  }

  setEditMode(isEditMode: boolean): this {
    this.isEditMode = isEditMode;
    return this;
  }

  setChartHeight(height: number): this {
    this.chartHeight = height;
    return this;
  }

  setDefaultChartHeight(height: number): this {
    this.defaultChartHeight = height;
    return this;
  }

  setCustomConfig(config: Partial<T>): this {
    this.containerConfig = { ...this.containerConfig, ...config };
    return this;
  }

  setItemResizeCallback(callback: (item: WidgetGridPosition, itemComponent: unknown) => void): this {
    this.containerConfig.itemResizeCallback = callback;
    return this;
  }

  setItemChangeCallback(callback: (item: WidgetGridPosition, itemComponent: unknown) => void): this {
    this.containerConfig.itemChangeCallback = callback;
    return this;
  }

  setFilterVisualization(config: {
    enableHighlighting?: boolean;
    defaultFilteredOpacity?: number;
    defaultHighlightedOpacity?: number;
    defaultHighlightColor?: string;
    defaultFilteredColor?: string;
  }): this {
    (this as unknown as { filterVisualization: typeof config }).filterVisualization = config;
    return this;
  }

  enableFilterHighlighting(
    enabled: boolean = true,
    options?: {
      filteredOpacity?: number;
      highlightedOpacity?: number;
      highlightColor?: string;
      filteredColor?: string;
    }
  ): this {
    const config = {
      enableHighlighting: enabled,
      defaultFilteredOpacity: options?.filteredOpacity || 0.3,
      defaultHighlightedOpacity: options?.highlightedOpacity || 1.0,
      defaultHighlightColor: options?.highlightColor || '#ff6b6b',
      defaultFilteredColor: options?.filteredColor || '#cccccc',
    };
    return this.setFilterVisualization(config);
  }

  build(): DashboardConfig {
    return {
      config: this.containerConfig as T,
      widgets: this.widgets,
      filterValues: this.filterValues,
      dashboardId: this.dashboardId,
      isEditMode: this.isEditMode,
      chartHeight: this.chartHeight,
      defaultChartHeight: this.defaultChartHeight,
    };
  }

  getConfig(): Partial<T> {
    return this.containerConfig;
  }

  getWidgets(): IWidget[] {
    return this.widgets;
  }

  getFilterValues(): IFilterValues[] {
    return this.filterValues;
  }

  static create<T extends DashboardGridConfig = DashboardGridConfig>(): DashboardContainerBuilder<T> {
    return new (this as unknown as { new (): DashboardContainerBuilder<T> })();
  }

  static updateConfig(config: DashboardGridConfig, updates: Partial<DashboardGridConfig>): DashboardGridConfig {
    return { ...config, ...updates };
  }

  static calculateChartHeight(cols: number, rows: number, flag: boolean = false, baseHeight: number = 400): number {
    const baseContainerHeight = baseHeight;
    const aspectRatio = cols / rows;
    const area = cols * rows;
    const zoomAdjustment = Math.log(area) / Math.log(2);
    const marginReduction = 0.95;
    let heightAdjustment = aspectRatio < 1 ? 1 / aspectRatio : 1;
    if (flag) {
      heightAdjustment = heightAdjustment * aspectRatio;
    }
    return Math.round(baseContainerHeight * heightAdjustment * marginReduction);
  }

  static calculateMapCenter(cols: number, rows: number): number[] {
    const baseLongitude = -95;
    const baseLatitude = 38;
    const aspectRatio = cols / rows;
    const longitudeAdjustment = aspectRatio > 1 ? (aspectRatio - 1) * 5 : 0;
    const latitudeAdjustment = aspectRatio < 1 ? (1 / aspectRatio - 1) * 2 : 0;
    return [baseLongitude + longitudeAdjustment, baseLatitude + latitudeAdjustment];
  }

  static calculateMapZoom(cols: number, rows: number): number {
    const baseZoom = 4.0;
    const area = cols * rows;
    const zoomAdjustment = Math.log(area) / Math.log(2);
    const aspectRatio = cols / rows;
    const aspectAdjustment = Math.abs(1 - aspectRatio) * 0.5;
    return baseZoom - zoomAdjustment * 0.1 - aspectAdjustment;
  }
}

export interface DashboardConfig {
  config: DashboardGridConfig;
  widgets: IWidget[];
  filterValues: IFilterValues[];
  dashboardId: string;
  isEditMode: boolean;
  chartHeight: number;
  defaultChartHeight: number;
  filterVisualization?: {
    enableHighlighting?: boolean;
    defaultFilteredOpacity?: number;
    defaultHighlightedOpacity?: number;
    defaultHighlightColor?: string;
    defaultFilteredColor?: string;
  };
}
