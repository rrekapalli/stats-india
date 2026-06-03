# Gauge Chart Builder

This folder contains the Gauge Chart Builder implementation and related files.

## Files

- `gauge-chart-builder.ts` - Main gauge chart builder class
- `gaugeChart-examples.ts` - Example usage patterns

## Usage

```typescript
import { GaugeChartBuilder } from '../gauge';

const widget = GaugeChartBuilder.create()
  .setData([{ value: 75, name: 'Progress' }])
  .setRange(0, 100)
  .setRadius('60%')
  .setProgress(true, 10)
  .setDetail(true, [0, 40], '#333', 20, '{value}%')
  .setHeader('Savings Goal')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Features

- Configurable ranges and angles
- Progress bars and pointers
- Custom color schemes
- Detail and title positioning
- KPI and progress indicators 