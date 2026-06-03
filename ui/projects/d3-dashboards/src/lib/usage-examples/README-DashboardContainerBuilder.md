# Dashboard Container Fluent API

The Dashboard Container Fluent API provides a modern, chainable interface for configuring dashboard containers, similar to the chart builder pattern. This API allows for dynamic configuration updates and provides a clean, readable way to set up dashboard properties.

## Overview

The Fluent API consists of:

1. **Abstract Base Class**: `DashboardContainerBuilder` - Provides common functionality
2. **Concrete Implementation**: `StandardDashboardBuilder` - Standard dashboard configuration
3. **Configuration Interface**: `DashboardConfig` - Complete configuration object
4. **Refactored Component**: `DashboardContainerComponent` - Uses the builder pattern internally

## Quick Start

### Basic Usage

```typescript
import { StandardDashboardBuilder } from '@your-lib/dashboards';

// Create a basic dashboard
const dashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('my-dashboard')
  .setWidgets([])
  .setFilterValues([])
  .build();
```

### Edit Mode Dashboard

```typescript
const editModeConfig = StandardDashboardBuilder.createEditMode()
  .setDashboardId('edit-dashboard')
  .setWidgets(widgets)
  .setFilterValues(filters)
  .build();
```

### Mobile Optimized Dashboard

```typescript
const mobileConfig = StandardDashboardBuilder.createMobile()
  .setDashboardId('mobile-dashboard')
  .setWidgets(widgets)
  .setFilterValues(filters)
  .build();
```

## API Reference

### StandardDashboardBuilder

#### Static Factory Methods

- `createStandard()` - Creates a standard dashboard configuration
- `createEditMode()` - Creates an edit mode dashboard configuration
- `createMobile()` - Creates a mobile-optimized dashboard configuration
- `createDesktop()` - Creates a desktop-optimized dashboard configuration

#### Configuration Methods

##### Grid Configuration
- `setGridType(gridType: GridType)` - Set the grid type
- `setDisplayGrid(displayGrid: DisplayGrid)` - Set display grid configuration
- `setOuterMargin(outerMargin: boolean)` - Set outer margin
- `setMaxCols(maxCols: number)` - Set maximum columns
- `setMinCols(minCols: number)` - Set minimum columns
- `setMaxRows(maxRows: number)` - Set maximum rows
- `setMinRows(minRows: number)` - Set minimum rows
- `setFixedColWidth(width: number)` - Set fixed column width
- `setFixedRowHeight(height: number)` - Set fixed row height
- `setMobileBreakpoint(breakpoint: number)` - Set mobile breakpoint

##### Interaction Configuration
- `setDraggable(enabled: boolean, options?: any)` - Set draggable configuration
- `setResizable(enabled: boolean, options?: any)` - Set resizable configuration
- `enableEmptyCellInteractions()` - Enable empty cell interactions
- `disableEmptyCellInteractions()` - Disable empty cell interactions

##### Layout Methods
- `enableEditMode()` - Enable edit mode with draggable/resizable widgets
- `disableEditMode()` - Disable edit mode (view-only)
- `setCompactLayout()` - Set compact layout (smaller margins/spacing)
- `setSpaciousLayout()` - Set spacious layout (larger margins/spacing)
- `setGridLayout()` - Set grid layout with visible grid lines
- `setFluidLayout()` - Set fluid layout (responsive columns)
- `setFixedLayout()` - Set fixed layout (non-responsive)
- `setMobileOptimized()` - Configure for mobile devices
- `setDesktopOptimized()` - Configure for desktop devices

##### Content Methods
- `setWidgets(widgets: IWidget[])` - Set widgets for the dashboard
- `addWidget(widget: IWidget)` - Add a single widget
- `setFilterValues(filterValues: IFilterValues[])` - Set filter values
- `setDashboardId(dashboardId: string)` - Set dashboard ID
- `setEditMode(isEditMode: boolean)` - Set edit mode
- `setChartHeight(height: number)` - Set chart height
- `setDefaultChartHeight(height: number)` - Set default chart height

##### Callback Methods
- `setItemResizeCallback(callback: Function)` - Set item resize callback
- `setItemChangeCallback(callback: Function)` - Set item change callback

##### Utility Methods
- `setCustomConfig(config: Partial<GridsterConfig>)` - Set custom configuration
- `setGridDimensions(cols: number, rows: number)` - Set grid dimensions
- `setItemSizeConstraints(minCols, maxCols, minRows, maxRows)` - Set item size constraints
- `setResponsive(breakpoint: number)` - Set responsive configuration

#### Static Utility Methods

- `calculateChartHeight(cols, rows, flag?, baseHeight?)` - Calculate chart height
- `calculateMapCenter(cols, rows)` - Calculate map center coordinates
- `calculateMapZoom(cols, rows)` - Calculate map zoom level

### DashboardConfig Interface

```typescript
interface DashboardConfig {
  config: GridsterConfig;
  widgets: IWidget[];
  filterValues: IFilterValues[];
  dashboardId: string;
  isEditMode: boolean;
  chartHeight: number;
  defaultChartHeight: number;
}
```

## Usage Patterns

### 1. Basic Dashboard Setup

```typescript
const dashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('basic-dashboard')
  .setWidgets([])
  .setFilterValues([])
  .build();
```

### 2. Edit Mode Dashboard

```typescript
const editConfig = StandardDashboardBuilder.createEditMode()
  .setDashboardId('edit-dashboard')
  .setWidgets(widgets)
  .setFilterValues(filters)
  .build();
```

### 3. Responsive Dashboard

```typescript
const responsiveConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('responsive-dashboard')
  .setResponsive(768)
  .setFluidLayout()
  .setWidgets(widgets)
  .setFilterValues(filters)
  .build();
```

### 4. Custom Configuration

```typescript
const customConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('custom-dashboard')
  .setGridType(GridType.VerticalFixed)
  .setDisplayGrid(DisplayGrid.Always)
  .setOuterMargin(true)
  .setDraggable(true)
  .setResizable(true)
  .setMaxCols(16)
  .setMinCols(1)
  .setMaxRows(100)
  .setMinRows(1)
  .setFixedColWidth(80)
  .setFixedRowHeight(80)
  .setMobileBreakpoint(768)
  .setWidgets(widgets)
  .setFilterValues(filters)
  .setEditMode(true)
  .setChartHeight(350)
  .setDefaultChartHeight(450)
  .build();
```

### 5. Dynamic Configuration Updates

```typescript
// In your component
public updateDashboardConfig(updates: Partial<DashboardConfig>): void {
  this.dashboardContainer.updateDashboardConfig(updates);
}

// Usage
this.updateDashboardConfig({
  isEditMode: true,
  widgets: newWidgets,
  chartHeight: 400
});
```

### 6. Using the Component's Builder Methods

```typescript
// Enable edit mode
this.dashboardContainer.enableEditMode();

// Disable edit mode
this.dashboardContainer.disableEditMode();

// Set responsive configuration
this.dashboardContainer.setResponsive(768);

// Set compact layout
this.dashboardContainer.setCompactLayout();

// Set mobile optimized
this.dashboardContainer.setMobileOptimized();

// Set desktop optimized
this.dashboardContainer.setDesktopOptimized();

// Get current configuration
const currentConfig = this.dashboardContainer.getCurrentConfig();

// Get builder for advanced configuration
const builder = this.dashboardContainer.getBuilder();
```

## Integration with DashboardContainerComponent

The `DashboardContainerComponent` has been refactored to use the Fluent API internally while maintaining backward compatibility. New methods have been added for dynamic configuration:

### New Component Methods

- `updateDashboardConfig(updates: Partial<DashboardConfig>)` - Update configuration dynamically
- `enableEditMode()` - Enable edit mode using builder
- `disableEditMode()` - Disable edit mode using builder
- `setResponsive(breakpoint: number)` - Set responsive configuration
- `setCompactLayout()` - Set compact layout
- `setSpaciousLayout()` - Set spacious layout
- `setMobileOptimized()` - Set mobile optimized layout
- `setDesktopOptimized()` - Set desktop optimized layout
- `getCurrentConfig()` - Get current dashboard configuration
- `getBuilder()` - Get the dashboard builder instance

### Backward Compatibility

All existing functionality is preserved. The component can still be used with the traditional `@Input()` properties:

```typescript
<vis-dashboard-container
  [widgets]="widgets"
  [filterValues]="filterValues"
  [dashboardId]="dashboardId"
  [isEditMode]="isEditMode"
  [options]="gridsterOptions">
</vis-dashboard-container>
```

## Examples

See `dashboard-container-examples.ts` for comprehensive usage examples including:

- Basic dashboard configurations
- Edit mode setups
- Mobile/desktop optimizations
- Custom grid configurations
- Dynamic configuration updates
- Responsive layouts
- Advanced custom configurations

## Benefits

1. **Fluent Interface**: Chainable methods for clean, readable configuration
2. **Type Safety**: Full TypeScript support with proper typing
3. **Dynamic Updates**: Easy configuration updates at runtime
4. **Reusability**: Pre-configured templates for common use cases
5. **Extensibility**: Easy to extend with new builder types
6. **Backward Compatibility**: Existing code continues to work
7. **Consistency**: Follows the same pattern as chart builders

## Migration Guide

### From Traditional Configuration

**Before:**
```typescript
const options: GridsterConfig = {
  gridType: GridType.VerticalFixed,
  displayGrid: DisplayGrid.None,
  outerMargin: true,
  draggable: { enabled: false },
  resizable: { enabled: false },
  maxCols: 12,
  minCols: 1,
  maxRows: 50,
  minRows: 1,
  fixedColWidth: 100,
  fixedRowHeight: 100,
  mobileBreakpoint: 640,
};
```

**After:**
```typescript
const config = StandardDashboardBuilder.createStandard()
  .setGridType(GridType.VerticalFixed)
  .setDisplayGrid(DisplayGrid.None)
  .setOuterMargin(true)
  .setDraggable(false)
  .setResizable(false)
  .setMaxCols(12)
  .setMinCols(1)
  .setMaxRows(50)
  .setMinRows(1)
  .setFixedColWidth(100)
  .setFixedRowHeight(100)
  .setMobileBreakpoint(640)
  .build();

const options = config.config;
```

### From Component Properties

**Before:**
```typescript
this.isEditMode = true;
this.options.draggable.enabled = true;
this.options.resizable.enabled = true;
```

**After:**
```typescript
this.dashboardContainer.enableEditMode();
```

## Best Practices

1. **Use Factory Methods**: Start with `createStandard()`, `createEditMode()`, etc.
2. **Chain Methods**: Use method chaining for clean, readable code
3. **Reuse Configurations**: Create reusable configuration functions
4. **Use Type Safety**: Leverage TypeScript for better development experience
5. **Update Dynamically**: Use `updateDashboardConfig()` for runtime changes
6. **Follow Patterns**: Use the same patterns as chart builders for consistency 