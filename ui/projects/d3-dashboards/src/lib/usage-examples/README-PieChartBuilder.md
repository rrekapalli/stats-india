# PieChartBuilder Class Documentation

## Overview

The `PieChartBuilder` class is a generic wrapper for ECharts pie charts that provides a fluent API for configuring pie chart options with sensible defaults. It supports method chaining for easy configuration and customization.

## Features

- **Method Chaining**: Fluent API for easy configuration
- **Sensible Defaults**: Pre-configured with common pie chart settings
- **Type Safety**: Full TypeScript support with proper interfaces
- **Flexible Customization**: Override any option with method chaining
- **Backward Compatibility**: Legacy function still available
- **Dynamic Updates**: Static methods for updating widget data

## Basic Usage

```typescript
import { PieChartBuilder, PieChartData } from './pieChart';

// Sample data
const data: PieChartData[] = [
  { value: 45, name: 'Stocks' },
  { value: 25, name: 'Bonds' },
  { value: 15, name: 'Cash' },
  { value: 10, name: 'Real Estate' },
  { value: 5, name: 'Commodities' },
];

// Create a basic pie chart
const widget = PieChartBuilder.create()
  .setData(data)
  .setHeader('Asset Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Advanced Usage

```typescript
// Create a custom styled pie chart
const widget = PieChartBuilder.create()
  .setData(data)
  .setTitle('Portfolio Distribution', 'As of December 2024')
  .setRadius(['40%', '70%'])
  .setCenter(['50%', '60%'])
  .setLabelFormatter('{b}: {c} ({d}%)')
  .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'])
  .setBorderRadius(8)
  .setBorder('#fff', 2)
  .setTooltip('item', '{b}: {c} ({d}%)')
  .setLegend('horizontal', 'bottom')
  .setHeader('Custom Pie Chart')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Available Methods

### Data and Basic Configuration

- `setData(data: PieChartData[])`: Set the chart data
- `setHeader(title: string, options?: string[])`: Set widget header
- `setPosition(position: { x: number; y: number; cols: number; rows: number })`: Set widget position

### Chart Title and Layout

- `setTitle(text: string, subtext?: string)`: Set chart title and subtitle
- `setGrid(grid: GridOptions)`: Configure chart grid layout

### Pie Chart Specific Options

- `setRadius(radius: string | string[])`: Set pie chart radius (single value or [inner, outer] for donut)
- `setCenter(center: string | string[])`: Set pie chart center position
- `setColors(colors: string[])`: Set custom colors for pie segments
- `setBorderRadius(radius: number)`: Set border radius for pie segments
- `setBorder(color: string, width?: number)`: Set border color and width

### Labels and Text

- `setLabelFormatter(formatter: string)`: Set label format string
- `setLabelShow(show: boolean)`: Show/hide labels
- `setLabelPosition(position: string)`: Set label position ('inside', 'outside', etc.)

### Tooltip and Legend

- `setTooltip(trigger: string, formatter?: string | Function)`: Configure tooltip
- `setLegend(orient: string, position: string)`: Configure legend position and orientation

### Visual Effects

- `setEmphasis(shadowBlur: number, shadowOffsetX: number, shadowColor: string)`: Set hover effects

### Advanced Options

- `setCustomOptions(options: EChartsOption)`: Override with custom ECharts options

## Static Methods

### Data Updates

```typescript
// Update widget data dynamically
const updatedData: PieChartData[] = [
  { value: 50, name: 'Stocks' },
  { value: 20, name: 'Bonds' },
  { value: 20, name: 'Cash' },
  { value: 8, name: 'Real Estate' },
  { value: 2, name: 'Commodities' },
];

PieChartBuilder.updateData(widget, updatedData);
```

### Legacy Support

```typescript
// For backward compatibility
const widget = PieChartBuilder.createPieChartWidget(data)
  .setHeader('Asset Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Data Interface

```typescript
export interface PieChartData {
  value: number;
  name: string;
}
```

## Common Use Cases

### 1. Basic Pie Chart
```typescript
const widget = PieChartBuilder.create()
  .setData(data)
  .setHeader('Basic Chart')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

### 2. Donut Chart
```typescript
const widget = PieChartBuilder.create()
  .setData(data)
  .setRadius(['50%', '80%'])
  .setLabelShow(false)
  .setHeader('Donut Chart')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

### 3. Compact Chart
```typescript
const widget = PieChartBuilder.create()
  .setData(data)
  .setRadius('60%')
  .setLabelFormatter('{d}%')
  .setLabelPosition('inside')
  .setGrid({ top: '10%', bottom: '10%' })
  .setHeader('Compact View')
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

### 4. Custom Styled Chart
```typescript
const widget = PieChartBuilder.create()
  .setData(data)
  .setTitle('Portfolio Distribution', 'Monthly Update')
  .setRadius(['35%', '65%'])
  .setColors(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'])
  .setBorderRadius(4)
  .setBorder('#fff', 1)
  .setTooltip('item', (params: any) => {
    return `${params.name}<br/>Value: $${params.value}<br/>Percentage: ${params.percent}%`;
  })
  .setLegend('vertical', 'left')
  .setHeader('Financial Overview')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Migration from Legacy Function

### Before (Legacy)
```typescript
import { createPieChartWidget } from './pieChart';

const widget = createPieChartWidget(data)
  .setHeader('Asset Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

### After (New Builder)
```typescript
import { PieChartBuilder } from './pieChart';

const widget = PieChartBuilder.create()
  .setData(data)
  .setHeader('Asset Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Benefits

1. **Better Type Safety**: Full TypeScript support with proper interfaces
2. **Fluent API**: Method chaining for better readability
3. **Flexible Configuration**: Easy to customize any aspect of the chart
4. **Sensible Defaults**: Pre-configured with common settings
5. **Backward Compatibility**: Legacy function still works
6. **Dynamic Updates**: Easy to update chart data programmatically
7. **Reusable**: Can be used across different components and features

## Examples

See `pieChart-examples.ts` for comprehensive usage examples including:
- Basic pie charts
- Custom styled charts
- Donut charts
- Compact charts
- Dynamic data updates
- Custom tooltips and legends
- Minimal charts 