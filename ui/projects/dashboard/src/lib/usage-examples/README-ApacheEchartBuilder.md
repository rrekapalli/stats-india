# ApacheEchartBuilder Architecture Documentation

## Overview

The `ApacheEchartBuilder` is an abstract base class that provides a generic wrapper for Apache ECharts with common functionality that can be extended by specific chart builders. This architecture promotes code reuse, type safety, and consistent API patterns across all chart types.

## Architecture Benefits

- **Code Reuse**: Common chart functionality is centralized in the base class
- **Type Safety**: Full TypeScript support with proper interfaces
- **Consistent API**: All chart builders follow the same method chaining pattern
- **Extensibility**: Easy to create new chart types by extending the base class
- **Maintainability**: Changes to common functionality only need to be made in one place

## Class Hierarchy

```
ApacheEchartBuilder (Abstract Base Class)
├── PieChartBuilder
├── BarChartBuilder
├── LineChartBuilder (future)
├── ScatterChartBuilder (future)
└── ... (other chart types)
```

## Abstract Base Class: ApacheEchartBuilder

### Key Features

- **Generic Type Support**: Uses TypeScript generics for type-safe chart options
- **Method Chaining**: Fluent API for easy configuration
- **Common Methods**: Pre-implemented methods for title, tooltip, legend, grid, etc.
- **Static Utilities**: Helper methods for data updates and chart type detection

### Abstract Methods

Subclasses must implement these methods:

```typescript
protected abstract getDefaultOptions(): Partial<T>;
protected abstract getChartType(): string;
```

### Common Methods Available

#### Data and Basic Configuration
- `setData(data: any)`: Set chart data
- `setHeader(title: string, options?: string[])`: Set widget header
- `setPosition(position: GridPosition)`: Set widget position

#### Chart Layout
- `setTitle(text: string, subtext?: string)`: Set chart title
- `setTitleOptions(titleOptions: any)`: Set custom title options
- `setGrid(grid: GridOptions)`: Configure chart grid

#### Interactivity
- `setTooltip(trigger: string, formatter?: string | Function)`: Configure tooltip
- `setTooltipOptions(tooltipOptions: any)`: Set custom tooltip options
- `setLegend(orient: string, position: string)`: Configure legend

#### Chart Elements
- `setXAxis(xAxis: any)`: Set x-axis configuration
- `setYAxis(yAxis: any)`: Set y-axis configuration
- `setSeries(series: any[])`: Set series configuration
- `addSeries(series: any)`: Add a single series

#### Visual Effects
- `setAnimation(animation: boolean | any)`: Set animation configuration
- `setBackgroundColor(color: string)`: Set background color

#### Advanced Options
- `setCustomOptions(options: T)`: Override with custom ECharts options
- `setEvents(onChartOptions: Function)`: Set event handlers

### Static Methods

- `static updateData(widget: IWidget, data: any)`: Update widget data
- `static isChartType(widget: IWidget, chartType: string)`: Check chart type
- `static getChartType(widget: IWidget)`: Get chart type from widget

## Creating a New Chart Builder

### Step 1: Define Interfaces

```typescript
export interface MyChartData {
  // Define your chart-specific data structure
}

export interface MyChartSeriesOptions {
  // Define your chart-specific series options
}

export interface MyChartOptions extends EChartsOption {
  // Extend EChartsOption with your chart-specific options
}
```

### Step 2: Create the Builder Class

```typescript
export class MyChartBuilder extends ApacheEchartBuilder<MyChartOptions> {
  private seriesOptions: MyChartSeriesOptions;

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  // Factory method
  static create(): MyChartBuilder {
    return new MyChartBuilder();
  }

  // Implement abstract methods
  protected override getDefaultOptions(): Partial<MyChartOptions> {
    return {
      // Your chart's default options
    };
  }

  protected override getChartType(): string {
    return 'your-chart-type';
  }

  // Chart-specific methods
  setChartSpecificOption(value: any): this {
    // Your chart-specific configuration
    return this;
  }

  // Override build method if needed
  override build(): IWidget {
    const finalOptions: MyChartOptions = {
      ...this.chartOptions,
      series: [{
        ...this.seriesOptions,
        type: 'your-chart-type',
      }],
    };

    return this.widgetBuilder
      .setEChartsOptions(finalOptions)
      .build();
  }

  // Static utilities
  static override updateData(widget: IWidget, data: any): void {
    ApacheEchartBuilder.updateData(widget, data);
  }

  static isMyChart(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'your-chart-type');
  }
}
```

## Example Implementations

### PieChartBuilder

```typescript
const widget = PieChartBuilder.create()
  .setData(pieData)
  .setTitle('Asset Allocation', 'Portfolio Breakdown')
  .setRadius(['40%', '70%'])
  .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'])
  .setLabelFormatter('{b}: {c} ({d}%)')
  .setTooltip('item', '{b}: {c} ({d}%)')
  .setLegend('horizontal', 'bottom')
  .setHeader('Portfolio Overview')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

### BarChartBuilder

```typescript
const widget = BarChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setCategories(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  .setTitle('Monthly Sales Report', 'Q1 2024')
  .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'])
  .setBarWidth('60%')
  .setBarBorderRadius(4)
  .setYAxisName('Sales ($)')
  .setXAxisName('Month')
  .setTooltip('axis', '{b}: {c}')
  .setLegend('horizontal', 'bottom')
  .setHeader('Sales Overview')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Advanced Usage Patterns

### Dynamic Data Updates

```typescript
// Update pie chart data
PieChartBuilder.updateData(widget, newPieData);

// Update bar chart data
BarChartBuilder.updateData(widget, newBarData);

// Generic update for any chart type
ApacheEchartBuilder.updateData(widget, newData);
```

### Chart Type Detection

```typescript
// Check specific chart types
if (PieChartBuilder.isPieChart(widget)) {
  // Handle pie chart specific logic
}

if (BarChartBuilder.isBarChart(widget)) {
  // Handle bar chart specific logic
}

// Generic chart type detection
const chartType = ApacheEchartBuilder.getChartType(widget);
if (chartType === 'pie') {
  // Handle pie chart
}
```

### Custom Options Override

```typescript
const widget = PieChartBuilder.create()
  .setData(pieData)
  .setHeader('Custom Chart')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .setCustomOptions({
    // Override with custom ECharts options
    series: [{
      type: 'pie',
      radius: '50%',
      data: pieData,
      label: {
        show: false
      }
    }]
  })
  .build();
```

## Best Practices

### 1. Method Chaining Order

```typescript
// Recommended order:
const widget = ChartBuilder.create()
  .setData(data)                    // 1. Set data first
  .setTitle(title, subtitle)        // 2. Set title
  .setChartSpecificOptions()        // 3. Chart-specific options
  .setVisualOptions()               // 4. Visual options (colors, etc.)
  .setInteractionOptions()          // 5. Interaction options (tooltip, legend)
  .setHeader(headerTitle)           // 6. Widget header
  .setPosition(position)            // 7. Position last
  .build();
```

### 2. Type Safety

```typescript
// Use proper typing for chart-specific data
const pieData: PieChartData[] = [
  { value: 45, name: 'Stocks' },
  { value: 25, name: 'Bonds' }
];

const barData: number[] = [10, 20, 30, 40, 50];
```

### 3. Error Handling

```typescript
try {
  const widget = ChartBuilder.create()
    .setData(data)
    .build();
} catch (error) {
  console.error('Failed to create chart widget:', error);
}
```

## Migration Guide

### From Legacy Functions

```typescript
// Before (Legacy)
const widget = createPieChartWidget(data)
  .setHeader('Chart')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();

// After (New Builder)
const widget = PieChartBuilder.create()
  .setData(data)
  .setHeader('Chart')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

### From Direct ECharts Options

```typescript
// Before (Direct ECharts)
const widget = new WidgetBuilder()
  .setEChartsOptions({
    series: [{
      type: 'pie',
      data: pieData,
      radius: '50%'
    }]
  })
  .build();

// After (Builder Pattern)
const widget = PieChartBuilder.create()
  .setData(pieData)
  .setRadius('50%')
  .build();
```

## Future Extensions

The architecture is designed to easily accommodate new chart types:

- **LineChartBuilder**: For line charts and area charts
- **ScatterChartBuilder**: For scatter plots
- **GaugeChartBuilder**: For gauge charts
- **HeatmapChartBuilder**: For heatmaps
- **RadarChartBuilder**: For radar charts

Each new chart builder can leverage the common functionality while adding chart-specific methods and options. 