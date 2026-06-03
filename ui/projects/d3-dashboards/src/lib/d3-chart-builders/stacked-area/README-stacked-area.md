# Stacked Area Chart Builder

The `StackedAreaChartBuilder` is a specialized chart builder for creating stacked area charts using Apache ECharts. It extends the base `ApacheEchartBuilder` and provides a fluent API for configuring multi-series stacked area visualizations.

## Features

- **Multi-series Support**: Create charts with multiple data series that stack on top of each other
- **Fluent API**: Chain method calls for easy configuration
- **Customizable Styling**: Control colors, opacity, line styles, and symbols
- **Smooth Curves**: Enable smooth curve interpolation
- **Gradient Areas**: Support for gradient fill colors
- **Large Dataset Support**: Built-in sampling for performance with large datasets
- **Export Support**: Excel/CSV export functionality
- **Dynamic Updates**: Update chart data programmatically

## Basic Usage

```typescript
import { StackedAreaChartBuilder, StackedAreaSeriesData } from '@dashboards/public-api';

// Define multi-series data
const data: StackedAreaSeriesData[] = [
  {
    name: 'Revenue',
    data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]
  },
  {
    name: 'Expenses',
    data: [80, 92, 71, 94, 60, 180, 160, 132, 141, 184, 240, 280]
  },
  {
    name: 'Profit',
    data: [40, 40, 30, 40, 30, 50, 50, 50, 50, 50, 50, 50]
  }
];

const xAxisData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Create the chart
const widget = StackedAreaChartBuilder.create()
  .setMultiSeriesData(data)
  .setXAxisData(xAxisData)
  .setTitle('Financial Overview', 'Revenue vs Expenses vs Profit')
  .setSmooth(true)
  .setStack('total')
  .setColors(['#5470c6', '#91cc75', '#fac858'])
  .setAreaStyle('#5470c6', 0.6)
  .setLineStyle(2, '#5470c6', 'solid')
  .setSymbol('circle', 5)
  .setTooltip('axis', '{b}: ${c}K')
  .setLegend('horizontal', 'bottom')
  .setHeader('Financial Overview')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

## API Reference

### Constructor and Factory Methods

#### `StackedAreaChartBuilder.create()`
Creates a new instance of the StackedAreaChartBuilder.

### Data Configuration

#### `setMultiSeriesData(data: StackedAreaSeriesData[])`
Sets the multi-series data for the stacked area chart.

```typescript
const data: StackedAreaSeriesData[] = [
  { name: 'Series 1', data: [10, 20, 30, 40] },
  { name: 'Series 2', data: [5, 15, 25, 35] }
];
builder.setMultiSeriesData(data);
```

#### `setXAxisData(data: string[])`
Sets the X-axis categories/labels.

```typescript
builder.setXAxisData(['Jan', 'Feb', 'Mar', 'Apr']);
```

#### `setXAxisName(name: string)`
Sets the X-axis name.

#### `setYAxisName(name: string)`
Sets the Y-axis name.

### Styling Configuration

#### `setSmooth(smooth: boolean)`
Enables or disables smooth curve interpolation.

```typescript
builder.setSmooth(true);
```

#### `setStack(stack: string)`
Sets the stacking mode. Use 'total' for normal stacking.

```typescript
builder.setStack('total');
```

#### `setColors(colors: string[])`
Sets the colors for multiple series.

```typescript
builder.setColors(['#5470c6', '#91cc75', '#fac858']);
```

#### `setAreaStyle(color: string, opacity: number)`
Sets the area fill style.

```typescript
builder.setAreaStyle('#5470c6', 0.6);
```

#### `setGradientAreaStyle(startColor: string, endColor: string, opacity: number)`
Sets a gradient area fill style.

```typescript
builder.setGradientAreaStyle('#5470c6', '#91cc75', 0.6);
```

#### `setLineStyle(width: number, color: string, type: string)`
Sets the line style for the chart.

```typescript
builder.setLineStyle(2, '#5470c6', 'solid');
```

#### `setSymbol(symbol: string, size: number)`
Sets the symbol type and size for data points.

```typescript
builder.setSymbol('circle', 5);
```

#### `setShowSymbol(show: boolean)`
Controls symbol visibility.

```typescript
builder.setShowSymbol(false);
```

### Chart Configuration

#### `setTitle(text: string, subtext?: string)`
Sets the chart title and subtitle.

```typescript
builder.setTitle('Financial Overview', 'Revenue vs Expenses');
```

#### `setTooltip(trigger: string, formatter?: string)`
Sets the tooltip configuration.

```typescript
builder.setTooltip('axis', '{b}: ${c}K');
```

#### `setLegend(orient: string, position: string)`
Sets the legend configuration.

```typescript
builder.setLegend('horizontal', 'bottom');
```

#### `setHeader(title: string, options?: string[])`
Sets the widget header.

```typescript
builder.setHeader('Financial Overview');
```

#### `setPosition(position: { x: number; y: number; cols: number; rows: number })`
Sets the widget position in the dashboard grid.

```typescript
builder.setPosition({ x: 0, y: 0, cols: 8, rows: 4 });
```

### Performance Configuration

#### `setSampling(sampling: string)`
Sets the sampling method for large datasets.

```typescript
builder.setSampling('average');
```

### Static Methods

#### `StackedAreaChartBuilder.updateData(widget: IWidget, data: StackedAreaSeriesData[])`
Updates the data of an existing stacked area chart widget.

```typescript
const newData: StackedAreaSeriesData[] = [
  { name: 'Revenue', data: [150, 180, 220, 280] },
  { name: 'Expenses', data: [100, 120, 140, 160] }
];
StackedAreaChartBuilder.updateData(widget, newData);
```

#### `StackedAreaChartBuilder.isStackedAreaChart(widget: IWidget): boolean`
Checks if a widget is a stacked area chart.

#### `StackedAreaChartBuilder.exportData(widget: IWidget): any[]`
Exports chart data for Excel/CSV export.

#### `StackedAreaChartBuilder.getExportHeaders(widget: IWidget): string[]`
Gets column headers for export.

#### `StackedAreaChartBuilder.getExportSheetName(widget: IWidget): string`
Gets the sheet name for export.

## Data Interfaces

### StackedAreaSeriesData
```typescript
interface StackedAreaSeriesData {
  name: string;
  data: number[];
  [key: string]: any;
}
```

### StackedAreaChartOptions
```typescript
interface StackedAreaChartOptions extends EChartsOption {
  xAxis?: {
    type?: string;
    data?: string[];
    name?: string;
    nameLocation?: string;
    axisLabel?: {
      rotate?: number;
      color?: string;
    };
  };
  yAxis?: {
    type?: string;
    name?: string;
    nameLocation?: string;
    axisLabel?: {
      color?: string;
    };
  };
  series?: StackedAreaChartSeriesOptions[];
}
```

## Examples

### Financial Overview Chart
```typescript
const financialData: StackedAreaSeriesData[] = [
  { name: 'Revenue', data: [120, 132, 101, 134, 90, 230, 210] },
  { name: 'Expenses', data: [80, 92, 71, 94, 60, 180, 160] },
  { name: 'Profit', data: [40, 40, 30, 40, 30, 50, 50] }
];

const widget = StackedAreaChartBuilder.create()
  .setMultiSeriesData(financialData)
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'])
  .setTitle('Financial Overview', 'Revenue vs Expenses vs Profit')
  .setSmooth(true)
  .setStack('total')
  .setColors(['#5470c6', '#91cc75', '#fac858'])
  .setAreaStyle('#5470c6', 0.6)
  .setTooltip('axis', '{b}: ${c}K')
  .setLegend('horizontal', 'bottom')
  .setHeader('Financial Overview')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

### Portfolio Allocation Chart
```typescript
const portfolioData: StackedAreaSeriesData[] = [
  { name: 'Stocks', data: [45, 52, 48, 61, 55, 68, 72] },
  { name: 'Bonds', data: [25, 28, 22, 35, 30, 42, 38] },
  { name: 'Cash', data: [15, 18, 12, 25, 20, 32, 28] }
];

const widget = StackedAreaChartBuilder.create()
  .setMultiSeriesData(portfolioData)
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'])
  .setTitle('Portfolio Allocation', 'Asset Class Distribution')
  .setSmooth(true)
  .setStack('total')
  .setColors(['#5470c6', '#91cc75', '#fac858'])
  .setAreaStyle('#5470c6', 0.7)
  .setTooltip('axis', '{b}: {c}%')
  .setLegend('horizontal', 'bottom')
  .setHeader('Portfolio Allocation')
  .setPosition({ x: 0, y: 4, cols: 8, rows: 4 })
  .build();
```

## Integration with Dashboard

The stacked area chart builder integrates seamlessly with the dashboard system:

```typescript
import { StandardDashboardBuilder } from '@dashboards/public-api';

const stackedAreaWidget = StackedAreaChartBuilder.create()
  .setMultiSeriesData(data)
  .setXAxisData(xAxisData)
  .setHeader('Stacked Area Chart')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();

const dashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('my-dashboard')
  .setWidgets([stackedAreaWidget])
  .setEditMode(false)
  .build();
```

## Performance Considerations

- For large datasets (>1000 points), use the `setSampling('average')` method
- Consider using `setShowSymbol(false)` for better performance with many data points
- Use appropriate chart dimensions to avoid rendering issues

## Browser Compatibility

The stacked area chart builder uses Apache ECharts and supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+ 