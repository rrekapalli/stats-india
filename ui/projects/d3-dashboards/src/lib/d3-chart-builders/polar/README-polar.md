# Polar Chart Builder

The Polar Chart Builder is a powerful component for creating polar coordinate charts using Apache ECharts. It provides a fluent API for building various types of polar charts including radar charts, performance metrics, and circular data visualizations.

## Features

- **360-degree visualization**: Full circular charts with customizable start and end angles
- **Multi-series support**: Compare multiple data series on the same chart
- **Customizable styling**: Control colors, gradients, symbols, and line styles
- **Smooth curves**: Enable smooth line interpolation for better visual appeal
- **Area filling**: Fill areas under the curve with solid colors or gradients
- **Stacking support**: Stack multiple series for cumulative visualization
- **Large dataset handling**: Built-in sampling for performance with large datasets
- **Export capabilities**: Built-in support for Excel and PDF export

## Basic Usage

```typescript
import { PolarChartBuilder } from '@dashboards/public-api';

// Create a basic polar chart
const widget = PolarChartBuilder.create()
  .setData([80, 65, 90, 75, 85, 70, 95, 60])
  .setTitle('Performance Metrics', '360-degree view')
  .setHeader('Performance Metrics')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Advanced Usage

```typescript
// Create an advanced polar chart with custom styling
const widget = PolarChartBuilder.create()
  .setData([85, 70, 95, 80, 90, 75, 100, 65])
  .setTitle('Performance Metrics', 'Advanced 360-degree view')
  .setPolarCenter(['50%', '50%'])
  .setPolarRadius(['25%', '75%'])
  .setStartAngle(0)
  .setEndAngle(360)
  .setSmooth(true)
  .setGradientAreaStyle('#5470c6', '#91cc75', 0.4)
  .setLineStyle(3, '#5470c6', 'solid')
  .setSymbol('circle', 8)
  .setTooltip('item', '{b}: {c}%')
  .setLegend('horizontal', 'bottom')
  .setHeader('Performance Metrics')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

## Multi-Series Polar Chart

```typescript
// Create a multi-series polar chart
const multiSeriesData = [
  { name: 'Current', data: [80, 65, 90, 75, 85, 70, 95, 60] },
  { name: 'Target', data: [90, 75, 95, 85, 90, 80, 100, 70] },
  { name: 'Previous', data: [70, 55, 80, 65, 75, 60, 85, 50] }
];

const widget = PolarChartBuilder.create()
  .setData(multiSeriesData)
  .setTitle('Financial Performance', 'Current vs Target vs Previous')
  .setPolarCenter(['50%', '50%'])
  .setPolarRadius(['20%', '70%'])
  .setSmooth(true)
  .setAreaStyle('#5470c6', 0.3)
  .setLineStyle(2, '#5470c6', 'solid')
  .setSymbol('circle', 6)
  .setTooltip('item', '{b}: {c}')
  .setLegend('horizontal', 'bottom')
  .setHeader('Financial Performance')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

## Radar-Style Chart

```typescript
// Create a radar-style polar chart
const radarData = [
  { name: 'Revenue', value: 85 },
  { name: 'Profit', value: 70 },
  { name: 'Growth', value: 90 },
  { name: 'Efficiency', value: 75 },
  { name: 'Innovation', value: 80 },
  { name: 'Market Share', value: 65 }
];

const widget = PolarChartBuilder.create()
  .setData(radarData.map(item => item.value))
  .setTitle('Business Metrics', 'Radar view of key performance indicators')
  .setPolarCenter(['50%', '50%'])
  .setPolarRadius(['15%', '65%'])
  .setSmooth(true)
  .setGradientAreaStyle('#ff6b6b', '#4ecdc4', 0.4)
  .setLineStyle(3, '#ff6b6b', 'solid')
  .setSymbol('diamond', 8)
  .setTooltip('item', '{b}: {c}%')
  .setLegend('horizontal', 'bottom')
  .setHeader('Business Metrics')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Partial Polar Chart

```typescript
// Create a partial polar chart (e.g., 180 degrees)
const widget = PolarChartBuilder.create()
  .setData([60, 75, 85, 70, 90, 65])
  .setTitle('Partial View', '180-degree polar chart')
  .setPolarCenter(['50%', '50%'])
  .setPolarRadius(['30%', '80%'])
  .setStartAngle(0)
  .setEndAngle(180)
  .setSmooth(true)
  .setAreaStyle('#fac858', 0.5)
  .setLineStyle(2, '#fac858', 'solid')
  .setSymbol('rect', 6)
  .setTooltip('item', '{b}: {c}')
  .setLegend('horizontal', 'bottom')
  .setHeader('Partial View')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## API Reference

### Core Methods

- `create()`: Create a new PolarChartBuilder instance
- `setData(data)`: Set the chart data (array of numbers or array of series objects)
- `build()`: Build and return the final widget

### Polar Configuration

- `setPolarCenter(center)`: Set the center position of the polar chart (e.g., ['50%', '50%'])
- `setPolarRadius(radius)`: Set the radius of the polar chart (e.g., ['30%', '80%'])
- `setStartAngle(angle)`: Set the start angle in degrees (0-360)
- `setEndAngle(angle)`: Set the end angle in degrees (0-360)
- `setAngleAxisRange(min, max)`: Set the angle axis range
- `setRadiusAxisRange(min, max)`: Set the radius axis range

### Styling Methods

- `setSmooth(smooth)`: Enable/disable smooth curve interpolation
- `setSymbol(symbol, size)`: Set symbol type and size (e.g., 'circle', 'diamond', 'rect')
- `setLineStyle(width, color, type)`: Set line style properties
- `setItemStyle(color, borderColor, borderWidth)`: Set item style properties
- `setAreaStyle(color, opacity)`: Set area fill style
- `setGradientAreaStyle(startColor, endColor, opacity)`: Set gradient area fill
- `setShowSymbol(show)`: Show/hide symbols on the chart
- `setStack(stack)`: Enable stacking for multiple series
- `setSampling(sampling)`: Set sampling method for large datasets

### Chart Configuration

- `setTitle(text, subtext)`: Set chart title and subtitle
- `setTooltip(trigger, formatter)`: Configure tooltip behavior
- `setLegend(orient, position)`: Configure legend display
- `setHeader(title, options)`: Set widget header
- `setPosition(position)`: Set widget position and size

### Data Update

```typescript
// Update chart data dynamically
PolarChartBuilder.updateData(widget, newData);
```

### Export Support

```typescript
// Export chart data
const data = PolarChartBuilder.exportData(widget);

// Get export headers
const headers = PolarChartBuilder.getExportHeaders(widget);

// Get export sheet name
const sheetName = PolarChartBuilder.getExportSheetName(widget);
```

## Data Formats

### Simple Data Array
```typescript
const data = [80, 65, 90, 75, 85, 70, 95, 60];
```

### Structured Data Array
```typescript
const data = [
  { name: '0°', value: 80 },
  { name: '45°', value: 65 },
  { name: '90°', value: 90 },
  // ...
];
```

### Multi-Series Data
```typescript
const data = [
  { name: 'Series 1', data: [80, 65, 90, 75, 85, 70, 95, 60] },
  { name: 'Series 2', data: [70, 55, 80, 65, 75, 60, 85, 50] }
];
```

## Examples

See the `polarChart-examples.ts` file for comprehensive usage examples including:

- Basic polar chart
- Advanced polar chart with custom styling
- Multi-series polar chart
- Radar-style chart
- Partial polar chart
- Large dataset chart with sampling
- Stacked polar chart

## Integration with Dashboard

The polar chart builder integrates seamlessly with the dashboard system:

```typescript
import { createPolarChartWidget } from './widgets/polar-chart-widget';

// Add to dashboard configuration
const polarChart = createPolarChartWidget();

this.dashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('my-dashboard')
  .setWidgets([
    // ... other widgets
    polarChart
  ])
  .setEditMode(false)
  .build();
```

## Performance Considerations

- For large datasets (>1000 points), use the `setSampling('average')` method
- Consider using `setShowSymbol(false)` for cleaner appearance with many data points
- Use appropriate chart sizes to ensure readability

## Browser Compatibility

The polar chart builder uses Apache ECharts and supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+ 