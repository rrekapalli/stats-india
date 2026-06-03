# Scatter Chart Builder

This folder contains the Scatter Chart Builder implementation and related files.

## Files

- `scatter-chart-builder.ts` - Main scatter chart builder class
- `scatterChart-examples.ts` - Example usage patterns

## Usage

```typescript
import { ScatterChartBuilder } from '../scatter';

const data = [
  { value: [10, 20], name: 'Point 1' },
  { value: [15, 25], name: 'Point 2' }
];

const widget = ScatterChartBuilder.create()
  .setData(data)
  .setXAxisName('Risk')
  .setYAxisName('Return')
  .setSymbol('circle', 10)
  .setLargeScatter(true, 2000)
  .setHeader('Risk vs Return')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Features

- Large dataset optimization
- Custom symbols and sizes
- Dynamic symbol sizing
- Progressive rendering
- Correlation analysis 