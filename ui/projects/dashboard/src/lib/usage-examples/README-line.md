# Line Chart Builder

This folder contains the Line Chart Builder implementation and related files.

## Files

- `line-chart-builder.ts` - Main line chart builder class
- `lineChart-examples.ts` - Example usage patterns

## Usage

```typescript
import { LineChartBuilder } from '../line';

const widget = LineChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  .setSmooth(true)
  .setAreaStyle('#5470c6', 0.3)
  .setHeader('Monthly Performance')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Features

- Smooth and straight line options
- Area fill capabilities
- Custom symbols and styling
- Multi-series support
- Time series data visualization 