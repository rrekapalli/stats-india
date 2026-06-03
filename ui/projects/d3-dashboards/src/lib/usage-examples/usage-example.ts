import { StandardDashboardBuilder, DashboardContainerComponent } from '../dashboard-container';
import { IWidget } from '../entities/IWidget';
import { IFilterValues } from '../entities/IFilterValues';
import { DashboardDashboardDisplayGrid } from '../grid/dashboard-grid.types';
import { 
  DESKTOP_GRID_SETTINGS, 
  MOBILE_GRID_SETTINGS, 
  TABLET_GRID_SETTINGS, 
  LARGE_DESKTOP_GRID_SETTINGS,
  SCREEN_BREAKPOINTS
} from '../dashboard-container/dashboard-constants';

/**
 * Example service for managing dashboard configurations
 */
export class DashboardConfigurationService {
  
  /**
   * Create a standard dashboard configuration
   */
  createStandardDashboard(dashboardId: string, widgets: IWidget[], filters: IFilterValues[]): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId(dashboardId)
      .setWidgets(widgets)
      .setFilterValues(filters)
      .build();
  }

  /**
   * Create an edit mode dashboard configuration
   */
  createEditModeDashboard(dashboardId: string, widgets: IWidget[], filters: IFilterValues[]): any {
    return StandardDashboardBuilder.createEditMode()
      .setDashboardId(dashboardId)
      .setWidgets(widgets)
      .setFilterValues(filters)
      .build();
  }

  /**
   * Create a mobile optimized dashboard configuration
   */
  createMobileDashboard(dashboardId: string, widgets: IWidget[], filters: IFilterValues[]): any {
    return StandardDashboardBuilder.createMobile()
      .setDashboardId(dashboardId)
      .setWidgets(widgets)
      .setFilterValues(filters)
      .build();
  }

  /**
   * Create a desktop optimized dashboard configuration
   */
  createDesktopDashboard(dashboardId: string, widgets: IWidget[], filters: IFilterValues[]): any {
    return StandardDashboardBuilder.createDesktop()
      .setDashboardId(dashboardId)
      .setWidgets(widgets)
      .setFilterValues(filters)
      .build();
  }

  /**
   * Update an existing dashboard configuration
   */
  updateDashboardConfig(
    currentConfig: any,
    updates: {
      isEditMode?: boolean;
      widgets?: IWidget[];
      filterValues?: IFilterValues[];
      chartHeight?: number;
      displayGrid?: (typeof DashboardDisplayGrid)[keyof typeof DashboardDisplayGrid];
      maxCols?: number;
      maxRows?: number;
    }
  ): any {
    const builder = StandardDashboardBuilder.createStandard();
    
    // Apply current configuration
    if (currentConfig.config) {
      builder.setCustomConfig(currentConfig.config);
    }
    if (currentConfig.widgets) {
      builder.setWidgets(currentConfig.widgets);
    }
    if (currentConfig.filterValues) {
      builder.setFilterValues(currentConfig.filterValues);
    }
    if (currentConfig.dashboardId) {
      builder.setDashboardId(currentConfig.dashboardId);
    }
    if (currentConfig.isEditMode !== undefined) {
      builder.setEditMode(currentConfig.isEditMode);
    }
    if (currentConfig.chartHeight) {
      builder.setChartHeight(currentConfig.chartHeight);
    }

    // Apply updates
    if (updates.isEditMode !== undefined) {
      if (updates.isEditMode) {
        builder.enableEditMode();
      } else {
        builder.disableEditMode();
      }
    }
    if (updates.widgets) {
      builder.setWidgets(updates.widgets);
    }
    if (updates.filterValues) {
      builder.setFilterValues(updates.filterValues);
    }
    if (updates.chartHeight) {
      builder.setChartHeight(updates.chartHeight);
    }
    if (updates.displayGrid !== undefined) {
      builder.setDashboardDisplayGrid(updates.displayGrid);
    }
    if (updates.maxCols) {
      builder.setMaxCols(updates.maxCols);
    }
    if (updates.maxRows) {
      builder.setMaxRows(updates.maxRows);
    }

    return builder.build();
  }
}

/**
 * Example usage patterns for the Dashboard Container Fluent API
 */
export class DashboardUsageExamples {

  /**
   * Example 1: Basic dashboard
   */
  static basicDashboard(): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId('basic-dashboard')
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 2: Edit mode dashboard
   */
  static editModeDashboard(): any {
    return StandardDashboardBuilder.createEditMode()
      .setDashboardId('edit-mode-dashboard')
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 3: Mobile optimized dashboard
   */
  static mobileDashboard(): any {
    return StandardDashboardBuilder.createMobile()
      .setDashboardId('mobile-dashboard')
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 4: Tablet optimized dashboard
   */
  static tabletDashboard(): any {
    return StandardDashboardBuilder.createTablet()
      .setDashboardId('tablet-dashboard')
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 5: Desktop optimized dashboard
   */
  static desktopDashboard(): any {
    return StandardDashboardBuilder.createDesktop()
      .setDashboardId('desktop-dashboard')
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 6: Custom configuration dashboard
   */
  static customDashboard(): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId('custom-dashboard')
      .setDashboardDisplayGrid(DashboardDisplayGrid.Always)
      .setOuterMargin(true)
      .setDraggable(true)
      .setResizable(true)
      .setMaxCols(16)
      .setMinCols(1)
      .setMaxRows(100)
      .setMinRows(1)
      .setFixedColWidth(80)
      .setFixedRowHeight(80)
      .setMobileBreakpoint(SCREEN_BREAKPOINTS.TABLET)
      .setWidgets([])
      .setFilterValues([])
      .setEditMode(true)
      .setChartHeight(350)
      .setDefaultChartHeight(450)
      .build();
  }

  /**
   * Example 7: Advanced configuration
   */
  static advancedDashboard(): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId('advanced-dashboard')
      .setDashboardDisplayGrid(DashboardDisplayGrid.Always)
      .setOuterMargin(true)
      .setDraggable(true)
      .setResizable(true)
      .setMaxCols(20)
      .setMinCols(2)
      .setMaxRows(80)
      .setMinRows(2)
      .setFixedColWidth(90)
      .setFixedRowHeight(90)
      .setMobileBreakpoint(SCREEN_BREAKPOINTS.DESKTOP)
      .enableEmptyCellInteractions()
      .setItemSizeConstraints(2, 8, 2, 10)
      .setWidgets([])
      .setFilterValues([])
      .setEditMode(true)
      .setChartHeight(400)
      .setDefaultChartHeight(500)
      .build();
  }

  /**
   * Example 8: Responsive dashboard
   */
  static responsiveDashboard(): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId('responsive-dashboard')
      .setResponsive(SCREEN_BREAKPOINTS.TABLET)
      .setDashboardDisplayGrid(DashboardDisplayGrid.None)
      .setOuterMargin(true)
      .setDraggable(false)
      .setResizable(false)
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 9: Compact layout dashboard
   */
  static compactLayoutDashboard(): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId('compact-layout-dashboard')
      .setCompactLayout()
      .setWidgets([])
      .setFilterValues([])
      .build();
  }

  /**
   * Example 10: Custom grid configuration
   */
  static customGridDashboard(): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId('custom-grid-dashboard')
      .setDashboardDisplayGrid(DashboardDisplayGrid.Always)
      .setOuterMargin(false)
      .setDraggable(true)
      .setResizable(true)
      .setMaxCols(32)
      .setMinCols(1)
      .setMaxRows(100)
      .setMinRows(1)
      .setFixedColWidth(60)
      .setFixedRowHeight(60)
      .setMobileBreakpoint(SCREEN_BREAKPOINTS.MOBILE)
      .enableEmptyCellInteractions()
      .setEmptyCellConfig({
        enableEmptyCellClick: true,
        enableEmptyCellContextMenu: true,
        enableEmptyCellDrop: true,
        enableEmptyCellDrag: true,
        emptyCellDragMaxCols: 32,
        emptyCellDragMaxRows: 100
      })
      .setWidgets([])
      .setFilterValues([])
      .setEditMode(true)
      .build();
  }
}

/**
 * Example component methods that can be used in a real dashboard component
 */
export class DashboardComponentMethods {

  /**
   * Initialize dashboard using the Fluent API
   */
  static initializeDashboard(
    dashboardId: string,
    widgets: IWidget[],
    filterValues: IFilterValues[],
    isEditMode: boolean = false
  ): any {
    return StandardDashboardBuilder.createStandard()
      .setDashboardId(dashboardId)
      .setWidgets(widgets)
      .setFilterValues(filterValues)
      .setEditMode(isEditMode)
      .setResponsive(768)
      .setGridDimensions(12, 50)
      .build();
  }

  /**
   * Enable edit mode using the component's builder methods
   */
  static enableEditMode(dashboardContainer: DashboardContainerComponent): void {
    dashboardContainer.enableEditMode();
  }

  /**
   * Disable edit mode using the component's builder methods
   */
  static disableEditMode(dashboardContainer: DashboardContainerComponent): void {
    dashboardContainer.disableEditMode();
  }

  /**
   * Set mobile optimized layout
   */
  static setMobileLayout(dashboardContainer: DashboardContainerComponent): void {
    dashboardContainer.setMobileOptimized();
  }

  /**
   * Set desktop optimized layout
   */
  static setDesktopLayout(dashboardContainer: DashboardContainerComponent): void {
    dashboardContainer.setDesktopOptimized();
  }

  /**
   * Set compact layout
   */
  static setCompactLayout(dashboardContainer: DashboardContainerComponent): void {
    dashboardContainer.setCompactLayout();
  }

  /**
   * Set spacious layout
   */
  static setSpaciousLayout(dashboardContainer: DashboardContainerComponent): void {
    dashboardContainer.setSpaciousLayout();
  }

  /**
   * Add a widget to the dashboard
   */
  static addWidget(
    dashboardContainer: DashboardContainerComponent,
    widgets: IWidget[],
    newWidget: IWidget
  ): IWidget[] {
    dashboardContainer.updateDashboardConfig({
      widgets: [...widgets, newWidget]
    });
    return dashboardContainer.getCurrentConfig().widgets;
  }

  /**
   * Remove a widget from the dashboard
   */
  static removeWidget(
    dashboardContainer: DashboardContainerComponent,
    widgets: IWidget[],
    widgetId: string
  ): IWidget[] {
    const updatedWidgets = widgets.filter(w => w.id !== widgetId);
    dashboardContainer.updateDashboardConfig({
      widgets: updatedWidgets
    });
    return dashboardContainer.getCurrentConfig().widgets;
  }

  /**
   * Update filter values
   */
  static updateFilters(
    dashboardContainer: DashboardContainerComponent,
    newFilters: IFilterValues[]
  ): IFilterValues[] {
    dashboardContainer.updateDashboardConfig({
      filterValues: newFilters
    });
    return dashboardContainer.getCurrentConfig().filterValues;
  }

  /**
   * Get current dashboard configuration
   */
  static getCurrentConfiguration(dashboardContainer: DashboardContainerComponent): any {
    return dashboardContainer.getCurrentConfig();
  }

  /**
   * Advanced configuration using the builder directly
   */
  static setAdvancedConfiguration(dashboardContainer: DashboardContainerComponent): void {
    const builder = dashboardContainer.getBuilder();
    
    const advancedConfig = builder
      .setDashboardDisplayGrid(DashboardDisplayGrid.Always)
      .setOuterMargin(true)
      .setDraggable(true)
      .setResizable(true)
      .setMaxCols(16)
      .setMinCols(2)
      .setMaxRows(80)
      .setMinRows(2)
      .setFixedColWidth(90)
      .setFixedRowHeight(90)
      .setMobileBreakpoint(SCREEN_BREAKPOINTS.DESKTOP)
      .enableEmptyCellInteractions()
      .setItemSizeConstraints(2, 8, 2, 10)
      .setEditMode(true)
      .setChartHeight(400)
      .setDefaultChartHeight(500)
      .build();

    dashboardContainer.updateDashboardConfig(advancedConfig);
  }

  /**
   * Set responsive configuration
   */
  static setResponsiveConfiguration(dashboardContainer: DashboardContainerComponent): void {
    const responsiveConfig = StandardDashboardBuilder.createStandard()
      .setDashboardId('responsive-dashboard')
      .setResponsive(SCREEN_BREAKPOINTS.TABLET)
      .setDashboardDisplayGrid(DashboardDisplayGrid.None)
      .setOuterMargin(true)
      .setDraggable(false)
      .setResizable(false)
      .setWidgets([])
      .setFilterValues([])
      .build();

    dashboardContainer.updateDashboardConfig(responsiveConfig);
  }

  /**
   * Create a custom grid configuration
   */
  static setCustomGridConfiguration(
    dashboardContainer: DashboardContainerComponent,
    dashboardId: string,
    widgets: IWidget[],
    filterValues: IFilterValues[]
  ): void {
    const customConfig = StandardDashboardBuilder.createStandard()
      .setDashboardId(dashboardId)
      .setDashboardDisplayGrid(DashboardDisplayGrid.Always)
      .setOuterMargin(false)
      .setDraggable(true)
      .setResizable(true)
      .setMaxCols(32)
      .setMinCols(1)
      .setMaxRows(100)
      .setMinRows(1)
      .setFixedColWidth(60)
      .setFixedRowHeight(60)
      .setMobileBreakpoint(SCREEN_BREAKPOINTS.MOBILE)
      .enableEmptyCellInteractions()
      .setEmptyCellConfig({
        enableEmptyCellClick: true,
        enableEmptyCellContextMenu: true,
        enableEmptyCellDrop: true,
        enableEmptyCellDrag: true,
        emptyCellDragMaxCols: 32,
        emptyCellDragMaxRows: 100
      })
      .setWidgets(widgets)
      .setFilterValues(filterValues)
      .setEditMode(true)
      .build();

    dashboardContainer.updateDashboardConfig(customConfig);
  }
} 