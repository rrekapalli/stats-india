# Dashboard library (`projects/dashboard`)

This library uses `@katoid/angular-grid-layout` (KTD). The legacy `projects/dashboards` + `angular-gridster2` stack has been removed; use `@dashboard/public-api` from the app.

This library provides reusable dashboard components for the MoneyPlant application. It allows you to create dynamic dashboards with various widget types like charts, tables, filters, and more.

## Installation

This library is part of the MoneyPlant project and is automatically available when the project is cloned.

## Usage

Import standalone components from `@dashboard/public-api`:

```typescript
import { Component } from '@angular/core';
import { DashboardContainerComponent } from '@dashboard/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardContainerComponent],
  template: `
    <vis-dashboard-container [widgets]="widgets"></vis-dashboard-container>
  `
})
export class AppComponent {
  // Using signals for reactive state management
  private widgetsSignal = signal<IWidget[]>([]);

  // Expose as computed property
  widgets = computed(() => this.widgetsSignal());

  constructor() {
    // Initialize widgets
    this.widgetsSignal.set([
      // Your widget configurations
    ]);
  }
}
```

## Components

### DashboardContainerComponent

A container component for dashboard widgets. It provides a grid-based layout using KTD (`ktd-grid`).

```html
<vis-dashboard-container 
  [widgets]="widgets"
  [filterValues]="filterValues"
  [dashboardId]="dashboardId"
  [isEditMode]="isEditMode"
  [options]="gridsterOptions"
  (containerTouchChanged)="onContainerTouchChanged($event)"
  (editModeStringChange)="onEditModeStringChange($event)"
  (changesMade)="onChangesMade($event)">
</vis-dashboard-container>
```

#### Inputs

- `widgets`: Array of widget configurations (IWidget[])
- `filterValues`: Current filter values applied to the dashboard (IFilterValues[])
- `dashboardId`: ID of the current dashboard (any)
- `isEditMode`: Whether the dashboard is in edit mode (boolean)
- `options`: Gridster configuration options (GridsterConfig)

#### Outputs

- `containerTouchChanged`: Emitted when the container is touched/modified
- `editModeStringChange`: Emitted when the edit mode string changes
- `changesMade`: Emitted when changes are made to the dashboard

### WidgetComponent

A dynamic widget component that renders different widget types based on configuration.

```html
<vis-widget 
  [widget]="widget"
  (onDataLoad)="handleDataLoad($event)"
  (onUpdateFilter)="handleFilterUpdate($event)">
</vis-widget>
```

#### Inputs

- `widget`: The widget configuration (IWidget)

#### Outputs

- `onDataLoad`: Emitted when data needs to be loaded for the widget
- `onUpdateFilter`: Emitted when filter values are updated

### WidgetHeaderComponent

A component for rendering widget headers with title and options.

```html
<vis-widget-header 
  [title]="widget.config.header.title"
  [options]="widget.config.header.options">
</vis-widget-header>
```

### WidgetConfigComponent

A component for configuring widget properties.

```html
<vis-widget-config [widget]="widget"></vis-widget-config>
```

## Widget Types

The library includes several widget types:

### EchartComponent

A widget for rendering ECharts visualizations.

### FilterComponent

A widget for displaying and managing filter values.

### TableComponent

A widget for displaying tabular data.

### TileComponent

A widget for displaying simple metric tiles.

### MarkdownCellComponent

A widget for displaying markdown content.

### CodeCellComponent

A widget for displaying code snippets.

## Services

The library provides several services to help manage dashboards and widgets:

### EventBusService

A service for handling events in the dashboard framework using a publish-subscribe pattern.

```typescript
import { EventBusService, EventType } from '@dashboard/public-api';

// In your component or service
class MyComponent {
  constructor(private eventBus: EventBusService) {
    // Subscribe to data load events
    this.eventBus.onDataLoad().subscribe(widget => {
      // Handle data loading
    });

    // Subscribe to filter update events
    this.eventBus.onFilterUpdate().subscribe(filterData => {
      // Handle filter updates
    });
  }

  // Publish events
  publishDataLoad(widget: IWidget): void {
    this.eventBus.publishDataLoad(widget);
  }

  publishFilterUpdate(filterData: any): void {
    this.eventBus.publishFilterUpdate(filterData);
  }
}
```

### WidgetPluginService

A service for managing widget plugins, making it easier to add new widget types.

```typescript
import { WidgetPluginService } from '@dashboard/public-api';

// In your component or service
class MyComponent {
  constructor(private widgetPluginService: WidgetPluginService) {
    // Get all available widget plugins
    const plugins = this.widgetPluginService.getAllPlugins();

    // Get a specific plugin
    const chartPlugin = this.widgetPluginService.getPlugin('echart');

    // Register a custom plugin
    this.widgetPluginService.registerPlugin({
      type: 'custom',
      displayName: 'Custom Widget',
      description: 'A custom widget type',
      icon: 'custom-icon',
      component: CustomWidgetComponent,
      defaultConfig: {
        options: {}
      },
      supportsFiltering: true,
      canBeFilterSource: true
    });
  }
}
```

### CalculationService

A service for performing calculations related to widget sizing and positioning.

### FilterService

A service for handling filter logic and operations.

### WidgetDataCacheService

A service for caching widget data to improve performance.

### VirtualScrollService

A service for implementing virtual scrolling for large dashboards.

### UndoRedoService

A service for implementing undo/redo functionality for dashboard editing.

## Interfaces

The library defines several interfaces for widget configuration:

- `IWidget`: The main widget configuration interface
- `IFilterOptions`: Configuration options for filter widgets
- `IFilterValues`: Filter value definitions
- `ITableOptions`: Configuration options for table widgets
- `ITileOptions`: Configuration options for tile widgets
- `IMarkdownCellOptions`: Configuration options for markdown widgets
- `ICodeCellOptions`: Configuration options for code widgets
- `IState`: Widget state interface
- `IWidgetPlugin`: Interface for widget plugins

## Development

### Building the library

Run `ng build dashboard` to build the library. The build artifacts will be stored in the `dist/dashboard` directory.

### Running tests

Run `ng test dashboard` to execute the unit tests via Karma.
