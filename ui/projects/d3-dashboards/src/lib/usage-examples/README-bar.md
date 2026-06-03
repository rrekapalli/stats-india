# Bar Chart Builder

This folder contains the Bar Chart Builder implementation and related files.

## Files

- `bar-chart-builder.ts` - Main bar chart builder class

## Usage

```typescript
import { BarChartBuilder } from '../bar';

const widget = BarChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setXAxisData(['Category A', 'Category B', 'Category C', 'Category D', 'Category E'])
  .setHeader('Monthly Sales')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Features

- Horizontal and vertical bar charts
- Custom bar styling
- Category and value axis configuration
- Color schemes and emphasis effects
- Data comparison visualization 