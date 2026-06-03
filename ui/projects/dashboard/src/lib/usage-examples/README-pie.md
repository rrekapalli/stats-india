# Pie Chart Builder

This folder contains the Pie Chart Builder implementation and related files.

## Files

- `pie-chart-builder.ts` - Main pie chart builder class
- `pieChart-examples.ts` - Example usage patterns
- `README-PieChartBuilder.md` - Detailed documentation

## Usage

```typescript
import { PieChartBuilder } from '../pie';

const widget = PieChartBuilder.create()
  .setData([{ value: 30, name: 'Category A' }, { value: 70, name: 'Category B' }])
  .setHeader('Asset Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Features

- Configurable radius and center positioning
- Custom label formatting
- Color schemes and emphasis effects
- Progress indicators
- Donut chart support 