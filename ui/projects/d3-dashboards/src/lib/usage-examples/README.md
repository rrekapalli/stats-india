# Density Map Chart Builder

The `DensityMapBuilder` is a specialized chart builder for creating geo map visualizations with density data using Apache ECharts. It extends the `ApacheEchartBuilder` base class and provides a fluent API for configuring map-based charts with color-coded density information.

## Features

- **Geo Map Visualization**: Support for various map types (HK, US, CN, etc.)
- **Density Coloring**: Visual map with customizable color gradients
- **Interactive Controls**: Pan, zoom, and hover effects
- **Customizable Styling**: Borders, shadows, emphasis effects
- **Responsive Design**: Adapts to different widget sizes
- **Type Safety**: Full TypeScript support with interfaces

## Basic Usage

```typescript
import { DensityMapBuilder } from './density-map';

// Basic density map
const widget = DensityMapBuilder.create()
  .setData([
    { name: 'Hong Kong Island', value: 100 },
    { name: 'Kowloon', value: 80 },
    { name: 'New Territories', value: 60 }
  ])
  .setMap('HK')
  .setHeader('Population Density')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Advanced Usage

```typescript
// Advanced density map with custom styling
const widget = DensityMapBuilder.create()
  .setData(densityData)
  .setMap('HK')
  .setTitle('Hong Kong Population Density', '2023 Data')
  .setVisualMap(0, 100, ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8'])
  .setRoam(true)
  .setZoom(1.2)
  .setCenter([114.1694, 22.3193])
  .setLabelShow(true, 'inside', '{b}\n{c}')
  .setAreaColor('#f5f5f5')
  .setBorderColor('#999', 0.5)
  .setEmphasisColor('#b8e186')
  .setShadow(15, 'rgba(0, 0, 0, 0.4)')
  .setTooltip('item', '{b}: {c} people/km²')
  .setHeader('Population Density Map')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
  .build();
```

## Data Format

The density map expects data in the following format:

```typescript
interface DensityMapData {
  name: string;    // Region name (must match map data)
  value: number;   // Density value
  [key: string]: any; // Additional properties
}
```

## Available Methods

### Data Configuration
- `setData(data: DensityMapData[])`: Set the density data
- `setMap(mapName: string)`: Set the map type (e.g., 'HK', 'US', 'CN')

### Visual Map Configuration
- `setVisualMap(min: number, max: number, colors?: string[])`: Configure the color scale
- `setVisualMapOptions(options: any)`: Set custom visual map options

### Map Interaction
- `setRoam(roam: boolean)`: Enable/disable pan and zoom
- `setZoom(zoom: number)`: Set the zoom level
- `setCenter(center: [number, number])`: Set center coordinates [longitude, latitude]

### Styling
- `setLabelShow(show: boolean, position?: string, formatter?: string)`: Configure labels
- `setAreaColor(color: string)`: Set background color for regions
- `setBorderColor(color: string, width?: number)`: Set border styling
- `setEmphasisColor(color: string)`: Set hover effect color
- `setShadow(blur?: number, color?: string)`: Set shadow effects

### Custom Options
- `setGeoOptions(options: any)`: Set custom geo configuration
- `setCustomOptions(options: DensityMapOptions)`: Override all options

## Supported Map Types

The builder supports various map types depending on the ECharts map data available:

- **HK**: Hong Kong
- **US**: United States
- **CN**: China
- **World**: World map
- **Custom**: Any custom map data

## Examples

### Hong Kong Population Density
```typescript
const hongKongData = [
  { name: 'Hong Kong Island', value: 100 },
  { name: 'Kowloon', value: 80 },
  { name: 'New Territories', value: 60 }
];

const widget = DensityMapBuilder.create()
  .setData(hongKongData)
  .setMap('HK')
  .setVisualMap(0, 100, ['#313695', '#4575b4', '#74add1'])
  .setHeader('Hong Kong Density')
  .build();
```

### US State Population
```typescript
const usData = [
  { name: 'California', value: 95 },
  { name: 'Texas', value: 85 },
  { name: 'Florida', value: 75 }
];

const widget = DensityMapBuilder.create()
  .setData(usData)
  .setMap('US')
  .setRoam(true)
  .setZoom(1.0)
  .setCenter([-98.5795, 39.8283])
  .setHeader('US Population')
  .build();
```

## Static Methods

### Update Data
```typescript
// Update existing widget data
DensityMapBuilder.updateData(widget, newData);
```

### Type Checking
```typescript
// Check if widget is a density map
const isMap = DensityMapBuilder.isDensityMap(widget);
```

### Create Widget Builder
```typescript
// Create widget builder with default settings
const builder = DensityMapBuilder.createDensityMapWidget(data, 'HK');
```

## Color Schemes

The builder supports various color schemes for different use cases:

### Blue Gradient (Default)
```typescript
['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8']
```

### Red Gradient
```typescript
['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15']
```

### Green Gradient
```typescript
['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476']
```

## Best Practices

1. **Data Validation**: Ensure region names match the map data exactly
2. **Color Contrast**: Use colors with sufficient contrast for accessibility
3. **Performance**: Limit data points for large datasets
4. **Responsive Design**: Test with different widget sizes
5. **User Experience**: Provide clear tooltips and labels

## Integration

The density map builder integrates seamlessly with the MoneyPlant dashboard system:

```typescript
// Add to dashboard
dashboard.addWidget(densityMapWidget);

// Update dynamically
DensityMapBuilder.updateData(widget, updatedData);
```

## Dependencies

- Apache ECharts
- ECharts map data for desired regions
- MoneyPlant dashboard framework

## Related Documentation

- [ApacheEchartBuilder](../README-ApacheEchartBuilder.md) - Base class documentation
- [Chart Builders Overview](../README-ChartBuilders.md) - General chart builder guide
- [ECharts Map Documentation](https://echarts.apache.org/en/option.html#series-map) - Official ECharts map documentation 