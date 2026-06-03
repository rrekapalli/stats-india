import { DashboardContainerBuilder, DashboardConfig } from './dashboard-container-builder';
import type { DashboardGridConfig } from '../grid/dashboard-grid.types';
import { DashboardDisplayGrid } from '../grid/dashboard-grid.types';
import {
  DESKTOP_GRID_SETTINGS,
  MOBILE_GRID_SETTINGS,
  TABLET_GRID_SETTINGS,
  LARGE_DESKTOP_GRID_SETTINGS,
  LAYOUT_PRESETS,
  SCREEN_BREAKPOINTS,
  getGridSettingsForScreenSize,
} from './dashboard-constants';

export class StandardDashboardBuilder extends DashboardContainerBuilder<DashboardGridConfig> {
  protected getDefaultConfig(): Partial<DashboardGridConfig> {
    return {
      cols: DESKTOP_GRID_SETTINGS.MAX_COLS,
      rowHeight: DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT,
      gap: 2,
      compactType: 'vertical',
      preventCollision: true,
      compactOnPropsChange: false,
      draggable: true,
      resizable: true,
      scrollSpeed: 2,
      maxRows: DESKTOP_GRID_SETTINGS.MAX_ROWS,
      minRows: DESKTOP_GRID_SETTINGS.MIN_ROWS,
      mobileBreakpoint: DESKTOP_GRID_SETTINGS.MOBILE_BREAKPOINT,
      backgroundConfig: { show: 'never' },
    };
  }

  enableEditMode(): this {
    return this
      .setDraggable(true)
      .setResizable(true)
      .setEditMode(true)
      .setDisplayGrid(DashboardDisplayGrid.Always);
  }

  disableEditMode(): this {
    return this
      .setDraggable(false)
      .setResizable(false)
      .setEditMode(false)
      .setDisplayGrid(DashboardDisplayGrid.None);
  }

  setResponsive(breakpoint: number = DESKTOP_GRID_SETTINGS.MOBILE_BREAKPOINT): this {
    return this.setMobileBreakpoint(breakpoint);
  }

  setCompactLayout(): this {
    return this
      .setOuterMargin(LAYOUT_PRESETS.COMPACT.OUTER_MARGIN)
      .setFixedColWidth(LAYOUT_PRESETS.COMPACT.FIXED_COL_WIDTH)
      .setFixedRowHeight(LAYOUT_PRESETS.COMPACT.FIXED_ROW_HEIGHT);
  }

  setSpaciousLayout(): this {
    return this
      .setOuterMargin(LAYOUT_PRESETS.SPACIOUS.OUTER_MARGIN)
      .setFixedColWidth(LAYOUT_PRESETS.SPACIOUS.FIXED_COL_WIDTH)
      .setFixedRowHeight(LAYOUT_PRESETS.SPACIOUS.FIXED_ROW_HEIGHT);
  }

  setGridLayout(): this {
    return this.setDisplayGrid(DashboardDisplayGrid.Always);
  }

  setFluidLayout(): this {
    return this.setMaxCols(24).setMinCols(1);
  }

  setFixedLayout(): this {
    return this
      .setMaxCols(DESKTOP_GRID_SETTINGS.MAX_COLS)
      .setMinCols(DESKTOP_GRID_SETTINGS.MAX_COLS);
  }

  setMobileOptimized(): this {
    const settings = MOBILE_GRID_SETTINGS;
    return this
      .setMobileBreakpoint(settings.MOBILE_BREAKPOINT)
      .setMaxCols(settings.MAX_COLS)
      .setFixedColWidth(settings.FIXED_COL_WIDTH)
      .setFixedRowHeight(settings.FIXED_ROW_HEIGHT);
  }

  setTabletOptimized(): this {
    const settings = TABLET_GRID_SETTINGS;
    return this
      .setMobileBreakpoint(settings.MOBILE_BREAKPOINT)
      .setMaxCols(settings.MAX_COLS)
      .setFixedColWidth(settings.FIXED_COL_WIDTH)
      .setFixedRowHeight(settings.FIXED_ROW_HEIGHT);
  }

  setDesktopOptimized(): this {
    const settings = DESKTOP_GRID_SETTINGS;
    return this
      .setMaxCols(settings.MAX_COLS)
      .setFixedColWidth(settings.FIXED_COL_WIDTH)
      .setFixedRowHeight(settings.FIXED_ROW_HEIGHT)
      .setMobileBreakpoint(SCREEN_BREAKPOINTS.DESKTOP);
  }

  setLargeDesktopOptimized(): this {
    const settings = LARGE_DESKTOP_GRID_SETTINGS;
    return this
      .setMaxCols(settings.MAX_COLS)
      .setFixedColWidth(settings.FIXED_COL_WIDTH)
      .setFixedRowHeight(settings.FIXED_ROW_HEIGHT)
      .setMobileBreakpoint(settings.MOBILE_BREAKPOINT);
  }

  setGridDimensions(cols: number, rows: number): this {
    return this.setMaxCols(cols).setMinCols(cols).setMaxRows(rows);
  }

  enableEmptyCellInteractions(): this {
    return this.setEmptyCellConfig({
      enableEmptyCellClick: true,
      enableEmptyCellContextMenu: true,
      enableEmptyCellDrop: true,
      enableEmptyCellDrag: true,
    });
  }

  disableEmptyCellInteractions(): this {
    return this.setEmptyCellConfig({
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrop: false,
      enableEmptyCellDrag: false,
    });
  }

  setItemSizeConstraints(
    minCols: number = DESKTOP_GRID_SETTINGS.MIN_COLS,
    maxCols: number = DESKTOP_GRID_SETTINGS.MAX_COLS,
    minRows: number = DESKTOP_GRID_SETTINGS.MIN_ROWS,
    maxRows: number = 50
  ): this {
    return this.setMinCols(minCols).setMaxCols(maxCols).setMinRows(minRows).setMaxRows(maxRows);
  }

  setScreenSize(screenSize: 'MOBILE' | 'TABLET' | 'DESKTOP' | 'LARGE_DESKTOP'): this {
    const settings = getGridSettingsForScreenSize(screenSize);
    return this
      .setMaxCols(settings.MAX_COLS)
      .setMinCols(settings.MIN_COLS)
      .setMaxRows(settings.MAX_ROWS)
      .setMinRows(settings.MIN_ROWS)
      .setFixedColWidth(settings.FIXED_COL_WIDTH)
      .setFixedRowHeight(settings.FIXED_ROW_HEIGHT)
      .setMobileBreakpoint(settings.MOBILE_BREAKPOINT);
  }

  static createStandard(): StandardDashboardBuilder {
    return new StandardDashboardBuilder()
      .setDisplayGrid(DashboardDisplayGrid.None)
      .setOuterMargin(true)
      .setDraggable(false)
      .setResizable(false)
      .setMaxCols(DESKTOP_GRID_SETTINGS.MAX_COLS)
      .setMinCols(DESKTOP_GRID_SETTINGS.MIN_COLS)
      .setMaxRows(DESKTOP_GRID_SETTINGS.MAX_ROWS)
      .setMinRows(DESKTOP_GRID_SETTINGS.MIN_ROWS)
      .setFixedColWidth(DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH)
      .setFixedRowHeight(DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT)
      .setMobileBreakpoint(DESKTOP_GRID_SETTINGS.MOBILE_BREAKPOINT);
  }

  static createEditMode(): StandardDashboardBuilder {
    return new StandardDashboardBuilder()
      .enableEditMode()
      .setMaxCols(DESKTOP_GRID_SETTINGS.MAX_COLS)
      .setMinCols(DESKTOP_GRID_SETTINGS.MIN_COLS)
      .setMaxRows(DESKTOP_GRID_SETTINGS.MAX_ROWS)
      .setMinRows(DESKTOP_GRID_SETTINGS.MIN_ROWS)
      .setFixedColWidth(DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH)
      .setFixedRowHeight(DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT)
      .setMobileBreakpoint(DESKTOP_GRID_SETTINGS.MOBILE_BREAKPOINT);
  }

  static createMobile(): StandardDashboardBuilder {
    return new StandardDashboardBuilder().setScreenSize('MOBILE').setCompactLayout();
  }

  static createTablet(): StandardDashboardBuilder {
    return new StandardDashboardBuilder().setScreenSize('TABLET').setSpaciousLayout();
  }

  static createDesktop(): StandardDashboardBuilder {
    return new StandardDashboardBuilder().setScreenSize('DESKTOP').setSpaciousLayout();
  }

  static createLargeDesktop(): StandardDashboardBuilder {
    return new StandardDashboardBuilder().setScreenSize('LARGE_DESKTOP').setSpaciousLayout();
  }

  override build(): DashboardConfig {
    return {
      config: this.containerConfig as DashboardGridConfig,
      widgets: this.widgets,
      filterValues: this.filterValues,
      dashboardId: this.dashboardId,
      isEditMode: this.isEditMode,
      chartHeight: this.chartHeight,
      defaultChartHeight: this.defaultChartHeight,
      filterVisualization: (this as { filterVisualization?: DashboardConfig['filterVisualization'] }).filterVisualization,
    };
  }
}
