# Chart Builders Documentation

This directory contains chart builders for the MoneyPlant dashboard library, providing a fluent API for creating various types of charts using Apache ECharts.

## Directory Structure

```
chart-builders/
├── apache-echart-builder.ts          # Base abstract class
├── index.ts                          # Main export file
├── README-ChartBuilders.md           # This documentation
├── README-ApacheEchartBuilder.md     # Base class documentation
├── pie/                              # Pie chart implementation
│   ├── pie-chart-builder.ts
│   ├── pieChart-examples.ts
│   ├── README-PieChartBuilder.md
│   ├── README.md
│   └── index.ts
├── line/                             # Line chart implementation
│   ├── line-chart-builder.ts
│   ├── lineChart-examples.ts
│   ├── README.md
│   └── index.ts
├── scatter/                          # Scatter chart implementation
│   ├── scatter-chart-builder.ts
│   ├── scatterChart-examples.ts
│   ├── README.md
│   └── index.ts
├── gauge/                            # Gauge chart implementation
│   ├── gauge-chart-builder.ts
│   ├── gaugeChart-examples.ts
│   ├── README.md
│   └── index.ts
├── heatmap/                          # Heatmap chart implementation
│   ├── heatmap-chart-builder.ts
│   ├── heatmapChart-examples.ts
│   ├── README.md
│   └── index.ts
├── density-map/                      # Density map chart implementation
│   ├── density-map-builder.ts
│   ├── densityMap-examples.ts
│   ├── README.md
│   └── index.ts
└── bar/                              # Bar chart implementation
    ├── bar-chart-builder.ts
    ├── README.md
    └── index.ts
```

## Overview

All chart builders extend the `ApacheEchartBuilder` base class and provide a consistent, chainable API for creating and configuring charts. Each builder includes:

- Type-safe interfaces for data and options
- Fluent API with method chaining
- Default configurations optimized for common use cases
- Static utility methods for data updates and type checking
- Comprehensive examples and usage patterns

## Available Chart Builders

### 1. PieChartBuilder (`pie/`)
Creates pie and donut charts for displaying proportions and percentages.

**Key Features:**
- Configurable radius and center positioning
- Custom label formatting
- Color schemes and emphasis effects
- Progress indicators

**Usage:**
```typescript
import { PieChartBuilder } from './pie';

const widget = PieChartBuilder.create()
  .setData([{ value: 30, name: 'Category A' }, { value: 70, name: 'Category B' }])
  .setHeader('Asset Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

### 2. LineChartBuilder (`line/`)
Creates line charts for time series data and trends.

**Key Features:**
- Smooth and straight line options
- Area fill capabilities
- Custom symbols and styling
- Multi-series support

**Usage:**
```typescript
import { LineChartBuilder } from './line';

const widget = LineChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  .setSmooth(true)
  .setAreaStyle('#5470c6', 0.3)
  .setHeader('Monthly Performance')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

### 3. ScatterChartBuilder (`scatter/`)
Creates scatter plots for correlation analysis and data distribution.

**Key Features:**
- Large dataset optimization
- Custom symbols and sizes
- Dynamic symbol sizing
- Progressive rendering

**Usage:**
```typescript
import { ScatterChartBuilder } from './scatter';

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

### 4. GaugeChartBuilder (`gauge/`)
Creates gauge charts for progress indicators and KPI displays.

**Key Features:**
- Configurable ranges and angles
- Progress bars and pointers
- Custom color schemes
- Detail and title positioning

**Usage:**
```typescript
import { GaugeChartBuilder } from './gauge';

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

### 5. HeatmapChartBuilder (`heatmap/`)
Creates heatmap charts for matrix data visualization.

**Key Features:**
- Visual map configuration
- Custom color schemes
- Large dataset handling
- Progressive rendering

**Usage:**
```typescript
import { HeatmapChartBuilder } from './heatmap';

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

### 6. DensityMapBuilder (`density-map/`)
Creates density map charts for geographical data visualization.

**Key Features:**
- Geo map visualization with various map types (HK, US, CN, etc.)
- Density coloring with customizable color gradients
- Interactive controls (pan, zoom, hover effects)
- Customizable styling (borders, shadows, emphasis effects)

**Usage:**
```typescript
import { DensityMapBuilder } from './density-map';

const data = [
  { name: 'Hong Kong Island', value: 100 },
  { name: 'Kowloon', value: 80 },
  { name: 'New Territories', value: 60 }
];

const widget = DensityMapBuilder.create()
  .setData(data)
  .setMap('HK')
  .setVisualMap(0, 100, ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8'])
  .setRoam(true)
  .setZoom(1.2)
  .setHeader('Hong Kong Population Density')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
  .build();
```

### 7. BarChartBuilder (`bar/`)
Creates bar charts for data comparison and categorization.

**Key Features:**
- Horizontal and vertical bar charts
- Custom bar styling
- Category and value axis configuration
- Color schemes and emphasis effects

**Usage:**
```typescript
import { BarChartBuilder } from './bar';

const widget = BarChartBuilder.create()
  .setData([10, 20, 30, 40, 50])
  .setXAxisData(['Category A', 'Category B', 'Category C', 'Category D', 'Category E'])
  .setHeader('Monthly Sales')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Importing Chart Builders

### Import All Chart Builders
```typescript
import { 
  PieChartBuilder, 
  LineChartBuilder, 
  ScatterChartBuilder, 
  GaugeChartBuilder, 
  HeatmapChartBuilder, 
  DensityMapBuilder,
  BarChartBuilder 
} from './chart-builders';
```

### Import Specific Chart Builder
```typescript
import { PieChartBuilder } from './chart-builders/pie';
import { LineChartBuilder } from './chart-builders/line';
import { ScatterChartBuilder } from './chart-builders/scatter';
import { GaugeChartBuilder } from './chart-builders/gauge';
import { HeatmapChartBuilder } from './chart-builders/heatmap';
import { DensityMapBuilder } from './chart-builders/density-map';
import { BarChartBuilder } from './chart-builders/bar';
```

## Common API Methods

All chart builders share these common methods from the base `ApacheEchartBuilder`:

### Data and Configuration
- `setData(data: any): this` - Set chart data
- `setTitle(text: string, subtext?: string): this` - Set chart title
- `setHeader(title: string, options?: string[]): this` - Set widget header
- `setPosition(position: { x: number; y: number; cols: number; rows: number }): this` - Set widget position

### Styling and Appearance
- `setColors(colors: string[]): this` - Set color scheme
- `setBorderRadius(radius: number): this` - Set border radius
- `setBorder(color: string, width: number): this` - Set border style
- `setEmphasis(shadowBlur: number, shadowOffsetX: number, shadowColor: string): this` - Set emphasis effects

### Tooltip and Legend
- `setTooltip(trigger: string, formatter?: string | Function): this` - Configure tooltip
- `setLegend(orient: string, position: string): this` - Configure legend

### Animation and Performance
- `setAnimation(animation: boolean | any): this` - Set animation options
- `setBackgroundColor(color: string): this` - Set background color

## Static Utility Methods

Each chart builder provides static utility methods:

- `updateData(widget: IWidget, data: any): void` - Update existing widget data
- `is[ChartType]Chart(widget: IWidget): boolean` - Check if widget is specific chart type
- `create[ChartType]ChartWidget(data?: any): WidgetBuilder` - Legacy creation method

## Examples

Each chart type folder contains comprehensive examples:

- `pie/pieChart-examples.ts` - Pie chart usage patterns
- `line/lineChart-examples.ts` - Line chart usage patterns
- `scatter/scatterChart-examples.ts` - Scatter chart usage patterns
- `gauge/gaugeChart-examples.ts` - Gauge chart usage patterns
- `heatmap/heatmapChart-examples.ts` - Heatmap chart usage patterns
- `density-map/densityMap-examples.ts` - Density map usage patterns

## Data Formats

### Pie Chart Data
```typescript
interface PieChartData {
  value: number;
  name: string;
}
```

### Line Chart Data
```typescript
interface LineChartData {
  name: string;
  value: number;
  [key: string]: any;
}
// Or simple number array: number[]
```

### Scatter Chart Data
```typescript
interface ScatterChartData {
  value: [number, number]; // [x, y] coordinates
  name?: string;
  [key: string]: any;
}
```

### Gauge Chart Data
```typescript
interface GaugeChartData {
  value: number;
  name?: string;
  [key: string]: any;
}
```

### Heatmap Chart Data
```typescript
interface HeatmapChartData {
  value: [number, number, number]; // [x, y, value]
  name?: string;
  [key: string]: any;
}
```

### Density Map Data
```typescript
interface DensityMapData {
  name: string;    // Region name (must match map data)
  value: number;   // Density value
  [key: string]: any; // Additional properties
}
```

## Best Practices

1. **Use the fluent API**: Chain methods for cleaner, more readable code
2. **Set appropriate positions**: Use grid positioning that fits your layout
3. **Optimize for large datasets**: Use progressive rendering and large scatter options
4. **Provide meaningful headers**: Set descriptive titles for better UX
5. **Use consistent styling**: Apply consistent colors and themes across charts
6. **Handle data updates**: Use static update methods for dynamic data changes

## Performance Considerations

- For large datasets (>1000 points), enable progressive rendering
- Use `setLargeScatter(true)` for scatter charts with many points
- Consider disabling animations for frequently updating charts
- Use appropriate chart types for your data (e.g., heatmaps for matrix data)

## TypeScript Support

All builders are fully typed with TypeScript interfaces, providing:
- IntelliSense support
- Compile-time error checking
- Type-safe data structures
- Generic type constraints

## Migration from Legacy Code

If you're using the legacy creation functions, you can migrate to the new builder pattern:

```typescript
// Old way
const widget = createPieChartWidget(data);

// New way
const widget = PieChartBuilder.create()
  .setData(data)
  .build();
```

The legacy functions are still available but marked as deprecated. 