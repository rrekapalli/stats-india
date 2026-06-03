# Sunburst Chart Builder

The Sunburst Chart Builder provides a comprehensive solution for creating hierarchical data visualizations using Apache ECharts. It follows the same pattern as other chart builders in the dashboard library and offers extensive customization options.

## Features

- **Hierarchical Data Visualization**: Display nested data structures in a circular, multi-level format
- **Customizable Styling**: Control colors, borders, labels, and animations
- **Level-based Configuration**: Different styling for each hierarchy level
- **Interactive Tooltips**: Rich tooltip information on hover
- **Export Support**: Built-in Excel/CSV export functionality
- **Fluent API**: Chainable methods for easy configuration
- **TypeScript Support**: Full type safety with comprehensive interfaces

## Basic Usage

```typescript
import { SunburstChartBuilder, SunburstChartData } from '@dashboards/public-api';

// Sample hierarchical data
const data: SunburstChartData[] = [
  {
    name: 'Portfolio',
    children: [
      {
        name: 'Stocks',
        value: 40,
        children: [
          { name: 'Technology', value: 15 },
          { name: 'Healthcare', value: 10 },
          { name: 'Finance', value: 8 },
          { name: 'Consumer', value: 7 }
        ]
      },
      {
        name: 'Bonds',
        value: 30,
        children: [
          { name: 'Government', value: 15 },
          { name: 'Corporate', value: 10 },
          { name: 'Municipal', value: 5 }
        ]
      },
      {
        name: 'Cash',
        value: 10
      }
    ]
  }
];

// Create a basic sunburst chart
const widget = SunburstChartBuilder.create()
  .setData(data)
  .setHeader('Portfolio Allocation')
  .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
  .build();
```

## Advanced Configuration

```typescript
const widget = SunburstChartBuilder.create()
  .setData(data)
  .setTitle('Financial Portfolio', 'Hierarchical Breakdown')
  .setRadius(['20%', '90%'])
  .setCenter(['50%', '50%'])
  .setLabelFormatter('{b}')
  .setLevels([
    {
      itemStyle: {
        borderWidth: 2,
        borderColor: '#777',
      },
    },
    {
      itemStyle: {
        borderWidth: 1,
        borderColor: '#555',
      },
    },
    {
      itemStyle: {
        borderWidth: 1,
        borderColor: '#333',
      },
    },
  ])
  .setTooltip('item', '{b}: {c}%')
  .setLegend('vertical', 'left')
  .setAnimationDuration(1000)
  .setAnimationEasing('cubicOut')
  .setSort('desc')
  .setHeader('Custom Portfolio View')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Data Structure

The sunburst chart expects hierarchical data with the following structure:

```typescript
interface SunburstChartData {
  name: string;           // Display name for the segment
  value?: number;         // Numeric value (optional for parent nodes)
  children?: SunburstChartData[];  // Nested data
  itemStyle?: {           // Custom styling for this segment
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}
```

## Configuration Methods

### Basic Configuration

- `setData(data: SunburstChartData[])`: Set the hierarchical data
- `setHeader(title: string, options?: string[])`: Set widget header
- `setPosition(position: { x: number; y: number; cols: number; rows: number })`: Set widget position

### Chart Styling

- `setRadius(radius: string | string[])`: Set inner and outer radius (e.g., ['20%', '90%'])
- `setCenter(center: string | string[])`: Set chart center position (e.g., ['50%', '50%'])
- `setLevels(levels: any[])`: Configure styling for each hierarchy level
- `setSort(sort: string)`: Set sort order ('asc', 'desc', or null)

### Labels and Text

- `setLabelFormatter(formatter: string)`: Set label format (e.g., '{b}', '{c}', '{d}%')
- `setLabelShow(show: boolean)`: Show/hide labels
- `setLabelPosition(position: string)`: Set label position
- `setTitle(text: string, subtext?: string)`: Set chart title and subtitle

### Interactivity

- `setTooltip(trigger: string, formatter?: string)`: Configure tooltip behavior
- `setLegend(orient: string, position: string)`: Configure legend display
- `setAnimationDuration(duration: number)`: Set animation duration in milliseconds
- `setAnimationEasing(easing: string)`: Set animation easing function

### Colors and Styling

- `setColors(colors: string[])`: Set color palette for segments
- `setBorderRadius(radius: number)`: Set border radius for segments
- `setBorder(color: string, width: number)`: Set border color and width
- `setEmphasis(shadowBlur: number, shadowOffsetX: number, shadowColor: string)`: Set hover effects

## Export Functionality

The sunburst chart builder includes built-in export capabilities:

```typescript
// Export data for Excel/CSV
const exportData = SunburstChartBuilder.exportData(widget);
const headers = SunburstChartBuilder.getExportHeaders(widget);
const sheetName = SunburstChartBuilder.getExportSheetName(widget);
```

The exported data includes:
- Level: Hierarchy depth
- Parent: Parent node name
- Name: Node name
- Value: Numeric value

## Integration with Dashboard

The sunburst chart integrates seamlessly with the dashboard system:

```typescript
import { StandardDashboardBuilder, DashboardConfig } from '@dashboards/public-api';

const dashboardConfig: DashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('my-dashboard')
  .setWidgets([
    SunburstChartBuilder.create()
      .setData(data)
      .setHeader('Portfolio Overview')
      .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
      .build()
  ])
  .setEditMode(false)
  .build();
```

## Examples

See `projects/dashboards/src/lib/usage-examples/sunburstChart-examples.ts` for comprehensive examples including:

1. **Basic Sunburst Chart**: Simple configuration with default settings
2. **Customized Sunburst Chart**: Advanced styling and configuration
3. **Organizational Structure**: Company hierarchy visualization
4. **Large Scale Sunburst**: Maximum radius configuration
5. **Animated Sunburst**: Custom animation settings
6. **Minimal Sunburst**: Simplified styling
7. **Sorted Sunburst**: Custom sorting configuration
8. **Compact Sunburst**: Space-efficient layout

## Best Practices

1. **Data Structure**: Ensure your hierarchical data is properly nested with meaningful names
2. **Color Coding**: Use consistent colors across related segments
3. **Level Configuration**: Configure different styling for each hierarchy level for better visual distinction
4. **Label Formatting**: Choose appropriate label formats based on your data type
5. **Tooltip Information**: Provide useful information in tooltips for better user experience
6. **Animation**: Use animations sparingly to avoid overwhelming the user
7. **Export**: Leverage the built-in export functionality for data analysis

## Performance Considerations

- Large datasets may impact rendering performance
- Consider limiting the depth of hierarchy for better readability
- Use appropriate radius settings to ensure segments are visible
- Optimize animation settings for smooth interactions

## Browser Compatibility

The sunburst chart is built on Apache ECharts and supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Related Components

- [Pie Chart Builder](../pie/README-pie.md): For simple circular data visualization
- [Treemap Chart Builder](../treemap/README-treemap.md): For rectangular hierarchical visualization
- [Dashboard Container](../../dashboard-container/README-DashboardContainerBuilder.md): For dashboard layout management 