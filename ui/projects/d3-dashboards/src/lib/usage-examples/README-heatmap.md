# Heatmap Chart Builder

This folder contains the Heatmap Chart Builder implementation and related files.

## Files

- `heatmap-chart-builder.ts` - Main heatmap chart builder class
- `heatmapChart-examples.ts` - Example usage patterns

## Usage

```typescript
import { HeatmapChartBuilder } from '../heatmap';

const data = [
  { value: [0, 0, 5], name: 'Mon-Morning' },
  { value: [1, 0, 7], name: 'Tue-Morning' }
];

const widget = HeatmapChartBuilder.create()
  .setData(data)
  .setXAxisData(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  .setYAxisData(['Morning', 'Afternoon', 'Evening'])
  .setVisualMap(0, 10, ['#313695', '#4575b4', '#74add1'])
  .setHeader('Weekly Activity')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
  .build();
```

## Features

- Visual map configuration
- Custom color schemes
- Large dataset handling
- Progressive rendering
- Matrix data visualization 