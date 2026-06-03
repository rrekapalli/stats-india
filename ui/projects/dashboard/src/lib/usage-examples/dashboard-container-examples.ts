import { StandardDashboardBuilder } from '../dashboard-container/standard-dashboard-builder';
import { IWidget } from '../entities/IWidget';
import { IFilterValues } from '../entities/IFilterValues';
import { DashboardDisplayGrid } from '../grid/dashboard-grid.types';
import { 
  DESKTOP_GRID_SETTINGS, 
  MOBILE_GRID_SETTINGS, 
  TABLET_GRID_SETTINGS, 
  LARGE_DESKTOP_GRID_SETTINGS,
  SCREEN_BREAKPOINTS
} from '../dashboard-container/dashboard-constants';

/**
 * Examples demonstrating how to use the Dashboard Container Fluent API
 */

// Example 1: Basic Dashboard
export function createBasicDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('basic-dashboard')
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 2: Edit Mode Dashboard
export function createEditModeDashboard(): any {
  return StandardDashboardBuilder.createEditMode()
    .setDashboardId('edit-mode-dashboard')
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 3: Mobile Optimized Dashboard
export function createMobileDashboard(): any {
  return StandardDashboardBuilder.createMobile()
    .setDashboardId('mobile-dashboard')
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 4: Tablet Optimized Dashboard
export function createTabletDashboard(): any {
  return StandardDashboardBuilder.createTablet()
    .setDashboardId('tablet-dashboard')
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 5: Custom Configuration Dashboard
export function createCustomDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('custom-dashboard')
    .setDisplayGrid(DashboardDisplayGrid.Always)
    .setOuterMargin(true)
    .setDraggable(true)
    .setResizable(true)
    .setMaxCols(16)
    .setMinCols(1)
    .setMaxRows(100)
    .setMinRows(1)
    .setFixedColWidth(80)
    .setFixedRowHeight(40)
    .setMobileBreakpoint(SCREEN_BREAKPOINTS.TABLET)
    .setWidgets([])
    .setFilterValues([])
    .setEditMode(true)
    .setChartHeight(350)
    .setDefaultChartHeight(450)
    .build();
}

// Example 6: Responsive Dashboard
export function createResponsiveDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('responsive-dashboard')
    .setResponsive(SCREEN_BREAKPOINTS.TABLET)
    .setDisplayGrid(DashboardDisplayGrid.None)
    .setOuterMargin(true)
    .setDraggable(false)
    .setResizable(false)
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 7: Compact Layout Dashboard
export function createCompactDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('compact-dashboard')
    .setCompactLayout()
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 8: Spacious Layout Dashboard
export function createSpaciousDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('spacious-dashboard')
    .setSpaciousLayout()
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 9: Grid Layout Dashboard
export function createGridLayoutDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('grid-layout-dashboard')
    .setGridLayout()
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 10: Fluid Layout Dashboard
export function createFluidLayoutDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('fluid-layout-dashboard')
    .setFluidLayout()
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 11: Fixed Layout Dashboard
export function createFixedLayoutDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('fixed-layout-dashboard')
    .setFixedLayout()
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 12: Large Desktop Dashboard
export function createLargeDesktopDashboard(): any {
  return StandardDashboardBuilder.createLargeDesktop()
    .setDashboardId('large-desktop-dashboard')
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 13: Advanced Custom Dashboard
export function createAdvancedDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('advanced-dashboard')
    .setDisplayGrid(DashboardDisplayGrid.Always)
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

// Example 14: Dashboard with Custom Grid Configuration
export function createCustomGridDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('custom-grid-dashboard')
    .setDisplayGrid(DashboardDisplayGrid.Always)
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

// Example 15: Responsive Dashboard with Constants
export function createResponsiveDashboardWithConstants(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('responsive-constants-dashboard')
    .setResponsive(SCREEN_BREAKPOINTS.TABLET)
    .setDisplayGrid(DashboardDisplayGrid.None)
    .setOuterMargin(true)
    .setDraggable(false)
    .setResizable(false)
    .setMaxCols(DESKTOP_GRID_SETTINGS.MAX_COLS)
    .setMinCols(DESKTOP_GRID_SETTINGS.MIN_COLS)
    .setMaxRows(50)
    .setMinRows(DESKTOP_GRID_SETTINGS.MIN_ROWS)
    .setFixedColWidth(DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH)
    .setFixedRowHeight(DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT)
    .setMobileBreakpoint(SCREEN_BREAKPOINTS.TABLET)
    .setWidgets([])
    .setFilterValues([])
    .build();
}

// Example 16: Dashboard with Extended Grid Configuration
export function createExtendedGridDashboard(): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('extended-grid-dashboard')
    .setDisplayGrid(DashboardDisplayGrid.Always)
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

// Example 17: Dashboard with Widgets
export function createDashboardWithWidgets(widgets: IWidget[]): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('widgets-dashboard')
    .setWidgets(widgets)
    .setFilterValues([])
    .build();
}

// Example 18: Dashboard with Filters
export function createDashboardWithFilters(filterValues: IFilterValues[]): any {
  return StandardDashboardBuilder.createStandard()
    .setDashboardId('filters-dashboard')
    .setWidgets([])
    .setFilterValues(filterValues)
    .build();
}

// Example 19: Dynamic Configuration Update
export function updateDashboardConfig(
  currentConfig: any,
  newSettings: {
    maxCols?: number;
    minCols?: number;
    maxRows?: number;
    minRows?: number;
    fixedColWidth?: number;
    fixedRowHeight?: number;
    mobileBreakpoint?: number;
  }
): any {
  const builder = StandardDashboardBuilder.createStandard()
    .setDashboardId(currentConfig.dashboardId)
    .setWidgets(currentConfig.widgets)
    .setFilterValues(currentConfig.filterValues);

  if (newSettings.maxCols) builder.setMaxCols(newSettings.maxCols);
  if (newSettings.minCols) builder.setMinCols(newSettings.minCols);
  if (newSettings.maxRows) builder.setMaxRows(newSettings.maxRows);
  if (newSettings.minRows) builder.setMinRows(newSettings.minRows);
  if (newSettings.fixedColWidth) builder.setFixedColWidth(newSettings.fixedColWidth);
  if (newSettings.fixedRowHeight) builder.setFixedRowHeight(newSettings.fixedRowHeight);
  if (newSettings.mobileBreakpoint) builder.setMobileBreakpoint(newSettings.mobileBreakpoint);

  return builder.build();
} 