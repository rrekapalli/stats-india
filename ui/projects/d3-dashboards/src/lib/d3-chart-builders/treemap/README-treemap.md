# Treemap Chart Builder

## Overview

The Treemap Chart Builder is a specialized chart builder for creating hierarchical treemap visualizations using Apache ECharts. It extends the base `ApacheEchartBuilder` class and provides a fluent API for creating interactive treemap charts.

## Features

- **Hierarchical Data Support**: Supports nested data structures with parent-child relationships
- **Interactive Navigation**: Built-in breadcrumb navigation and zoom functionality
- **Customizable Styling**: Configurable colors, borders, labels, and emphasis effects
- **Level-based Configuration**: Different styling for different hierarchy levels
- **Export Support**: Excel/CSV export functionality
- **Responsive Design**: Adapts to container size changes

## Data Structure

The treemap chart expects data in the following format:

```typescript
interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}
```

## Usage Examples

### Basic Usage

```typescript
import { TreemapChartBuilder } from '@dashboards/public-api';

const data = [
  {
    name: 'Technology',
    value: 40,
    children: [
      { name: 'Apple Inc.', value: 15 },
      { name: 'Microsoft Corp.', value: 12 },
      { name: 'Alphabet Inc.', value: 8 },
      { name: 'Amazon.com Inc.', value: 5 }
    ]
  },
  {
    name: 'Healthcare',
    value: 25,
    children: [
      { name: 'Johnson & Johnson', value: 10 },
      { name: 'Pfizer Inc.', value: 8 },
      { name: 'UnitedHealth Group', value: 7 }
    ]
  }
];

const widget = TreemapChartBuilder.create()
  .setData(data)
  .setTitle('Portfolio Distribution', 'By Sector and Company')
  .setHeader('Portfolio Distribution')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

### Advanced Configuration

```typescript
const widget = TreemapChartBuilder.create()
  .setData(data)
  .setTitle('Investment Portfolio', 'By Asset Class and Sector')
  .setBreadcrumb(true, '10%', '10%', '10%', '10%')
  .setItemStyle('#fff', 1, 1)
  .setLabelFormatter('{b}\n{c}%')
  .setLevels([
    {
      itemStyle: { borderColor: '#777', borderWidth: 0, gapWidth: 1 },
      label: { show: false }
    },
    {
      itemStyle: { borderColor: '#555', borderWidth: 5, gapWidth: 1 },
      label: { show: true, formatter: '{b}\n{c}%' }
    }
  ])
  .setEmphasis(10, 0, 'rgba(0, 0, 0, 0.5)')
  .setRoam(true)
  .setNodeClick('zoomToNode')
  .setTooltip('item', '{b}: {c}%')
  .setHeader('Investment Portfolio')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## API Reference

### Constructor Methods

- `static create()`: Creates a new TreemapChartBuilder instance

### Configuration Methods

- `setData(data: TreemapData[])`: Sets the hierarchical data for the treemap
- `setBreadcrumb(show: boolean, top?, left?, right?, bottom?)`: Configures breadcrumb navigation
- `setItemStyle(borderColor: string, borderWidth: number, gapWidth: number)`: Sets item styling
- `setLabelFormatter(formatter: string)`: Sets label format string
- `setLevels(levels: LevelConfig[])`: Configures styling for different hierarchy levels
- `setRoam(roam: boolean)`: Enables/disables pan and zoom
- `setNodeClick(behavior: string)`: Sets click behavior ('zoomToNode', 'link', etc.)
- `setSize(width: string|number, height: string|number)`: Sets chart dimensions

### Static Methods

- `static updateData(widget: IWidget, data: any)`: Updates data on existing widget
- `static isTreemapChart(widget: IWidget)`: Checks if widget is a treemap chart
- `static exportData(widget: IWidget)`: Exports data for Excel/CSV
- `static getExportHeaders(widget: IWidget)`: Gets export column headers
- `static getExportSheetName(widget: IWidget)`: Gets export sheet name

## Integration with Overall Component

The treemap chart is integrated into the overall dashboard component with three different widgets:

1. **Portfolio Distribution Treemap**: Shows investment portfolio by sector and company
2. **Expense Categories Treemap**: Shows monthly expenses by category and subcategory
3. **Large Scale Treemap**: Demonstrates performance with 100+ nodes

### Widget Creation Functions

```typescript
import {
  createTreemapChartWidget,
  createExpenseTreemapWidget,
  createLargeScaleTreemapWidget
} from './widgets';

// Create widgets
const portfolioTreemap = createTreemapChartWidget();
const expenseTreemap = createExpenseTreemapWidget();
const largeScaleTreemap = createLargeScaleTreemapWidget();
```

### Data Update Functions

```typescript
import {
  updateTreemapChartData,
  getUpdatedTreemapChartData,
  getAlternativeTreemapChartData
} from './widgets';

// Update existing widget
updateTreemapChartData(widget);

// Get updated data
const newData = getUpdatedTreemapChartData();

// Get alternative data
const altData = getAlternativeTreemapChartData();
```

## ECharts Configuration

The treemap chart uses the following ECharts components:

- `TreemapChart`: Main chart type
- `TitleComponent`: Chart title and subtitle
- `TooltipComponent`: Interactive tooltips
- `LegendComponent`: Chart legend (if needed)

## Export Functionality

The treemap chart supports Excel/CSV export with the following features:

- **Flattened Data**: Hierarchical data is flattened for export
- **Level Information**: Export includes hierarchy level information
- **Custom Headers**: Configurable column headers
- **Sheet Naming**: Custom sheet names for Excel export

## Performance Considerations

- **Large Datasets**: The treemap can handle 100+ nodes efficiently
- **Memory Usage**: Hierarchical data structures are optimized for memory usage
- **Rendering**: Uses ECharts' optimized rendering engine
- **Updates**: Efficient data updates without full re-rendering

## Browser Compatibility

The treemap chart is compatible with all modern browsers that support:
- ES6+ features
- Canvas rendering
- CSS Grid/Flexbox for layout

## Dependencies

- Apache ECharts 5.x
- Angular 17+
- TypeScript 5.x 