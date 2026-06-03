# Area Chart Builder

This folder contains the Area Chart Builder implementation and related files.

## Files

- `area-chart-builder.ts` - Main area chart builder class
- `areaChart-examples.ts` - Example usage patterns

## Overview

The Area Chart Builder is designed for creating large-scale area charts based on Apache ECharts. It extends the line chart functionality with area fill capabilities, making it perfect for visualizing trends, performance metrics, and time series data.

## Features

- **Large-scale data support** with sampling capabilities
- **Smooth and straight line options**
- **Area fill with solid colors or gradients**
- **Multi-series support** with stacking
- **Custom symbols and styling**
- **Performance optimized** for large datasets
- **Export functionality** for data extraction

## Basic Usage

```typescript
import { AreaChartBuilder } from '../area';

const widget = AreaChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  .setHeader('Monthly Performance')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Advanced Usage

```typescript
const widget = AreaChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  .setTitle('Portfolio Performance', 'Last 5 months')
  .setSmooth(true)
  .setGradientAreaStyle('#5470c6', '#91cc75', 0.4)
  .setLineStyle(3, '#5470c6', 'solid')
  .setSymbol('circle', 8)
  .setTooltip('axis', '{b}: {c}')
  .setLegend('horizontal', 'bottom')
  .setHeader('Performance Chart')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

## Multi-Series Area Chart

```typescript
const widget = AreaChartBuilder.create()
  .setData([
    { name: 'Revenue', data: [10, 20, 30, 40, 50] },
    { name: 'Expenses', data: [5, 15, 25, 35, 45] },
    { name: 'Profit', data: [5, 5, 5, 5, 5] }
  ])
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  .setStack('total')
  .setHeader('Financial Overview')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

## Large-Scale Data Visualization

```typescript
const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
  name: `Point ${i + 1}`,
  value: Math.random() * 100 + Math.sin(i * 0.1) * 20,
}));

const widget = AreaChartBuilder.create()
  .setData(largeDataset.map(item => item.value))
  .setXAxisData(largeDataset.map(item => item.name))
  .setTitle('Large Scale Data', '1000 data points with sampling')
  .setSmooth(true)
  .setSampling('average')
  .setGradientAreaStyle('#ff6b6b', '#4ecdc4', 0.3)
  .setShowSymbol(false)
  .setHeader('Large Scale Area Chart')
  .setPosition({ x: 0, y: 0, cols: 12, rows: 6 })
  .build();
```

## API Reference

### Data Configuration

- `setData(data: AreaChartData[] | number[])`: Set chart data
- `setXAxisData(data: string[])`: Set X-axis categories
- `setXAxisName(name: string)`: Set X-axis name
- `setYAxisName(name: string)`: Set Y-axis name

### Visual Styling

- `setSmooth(smooth: boolean)`: Enable/disable smooth curves
- `setSymbol(symbol: string, size: number)`: Set symbol type and size
- `setLineStyle(width: number, color: string, type: string)`: Configure line appearance
- `setItemStyle(color: string, borderColor?: string, borderWidth?: number)`: Set symbol styling
- `setAreaStyle(color: string, opacity: number)`: Set solid area fill
- `setGradientAreaStyle(startColor: string, endColor: string, opacity: number)`: Set gradient area fill
- `setShowSymbol(show: boolean)`: Show/hide symbols

### Advanced Features

- `setStack(stack: string)`: Enable stacking for multi-series charts
- `setSampling(sampling: string)`: Set sampling method for large datasets

### Chart Layout

- `setTitle(text: string, subtext?: string)`: Set chart title and subtitle
- `setTooltip(trigger: string, formatter?: string | Function)`: Configure tooltip
- `setLegend(orient: string, position: string)`: Configure legend
- `setHeader(title: string, options?: string[])`: Set widget header
- `setPosition(position: { x: number; y: number; cols: number; rows: number })`: Set widget position

### Static Methods

- `static updateData(widget: IWidget, data: any)`: Update widget data dynamically
- `static isAreaChart(widget: IWidget)`: Check if widget is an area chart
- `static exportData(widget: IWidget)`: Export chart data
- `static getExportHeaders(widget: IWidget)`: Get export headers
- `static getExportSheetName(widget: IWidget)`: Get export sheet name

## Data Interface

```typescript
export interface AreaChartData {
  name: string;
  value: number;
  [key: string]: any;
}
```

## Examples

### Basic Area Chart
```typescript
createBasicAreaChart() // Simple area chart with default styling
```

### Smooth Area Chart with Gradient
```typescript
createSmoothAreaChart() // Smooth curves with gradient fill
```

### Stacked Area Chart
```typescript
createStackedAreaChart() // Multi-series with stacking
```

### Large Scale Area Chart
```typescript
createLargeScaleAreaChart() // 1000+ data points with sampling
```

### Performance Monitoring
```typescript
createPerformanceAreaChart() // System performance visualization
```

## Performance Considerations

- Use `setSampling('average')` for datasets with 1000+ points
- Disable symbols with `setShowSymbol(false)` for large datasets
- Consider using `setSmooth(false)` for better performance with large datasets

## Export Support

The Area Chart Builder includes built-in export functionality:

```typescript
// Export data to Excel
const data = AreaChartBuilder.exportData(widget);
const headers = AreaChartBuilder.getExportHeaders(widget);
const sheetName = AreaChartBuilder.getExportSheetName(widget);
```

## Integration with Dashboard

```typescript
import { StandardDashboardBuilder } from '../dashboard-container';

const dashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('area-chart-dashboard')
  .setWidgets([
    createBasicAreaChart(),
    createSmoothAreaChart(),
    createStackedAreaChart()
  ])
  .setEditMode(false)
  .build();
``` 