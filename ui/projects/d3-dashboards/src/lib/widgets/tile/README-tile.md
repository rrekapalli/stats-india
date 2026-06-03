# Generalized Tile Builder

The Generalized Tile Builder provides a comprehensive fluent API for creating tile widgets in the dashboard system. It follows the same pattern as the ECharts builders, offering extensive configuration options for styling, layout, and data management.

## Features

- **Fluent API**: Chain methods for easy configuration
- **Type Safety**: Full TypeScript support with proper interfaces
- **Generalized Data**: Flexible data structure with custom properties
- **Advanced Styling**: Comprehensive styling options including colors, borders, fonts
- **Layout Control**: Flexbox-based layout configuration
- **Factory Methods**: Pre-configured builders for common tile types
- **Dynamic Updates**: Update tile data after creation
- **Export Support**: Built-in data export functionality
- **Event Handling**: Support for data loading and interaction events

## Basic Usage

### Simple Tile Creation with New Methods

```typescript
import { TileBuilder } from '@your-org/dashboards';

const widget = TileBuilder.create()
  .setData({ value: '$1,234', change: '+5.2%', type: 'revenue' })
  .setHeader('Revenue Metrics')
  .setSubHeader('Monthly Overview')
  .setColor('#10b981')
  .setBackgroundColor('#f0fdf4')
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

### Advanced Usage with Custom Styling and Layout

```typescript
const widget = TileBuilder.create()
  .setData({ 
    value: '$2,500', 
    change: '-2.1%', 
    type: 'expense',
    category: 'operational'
  })
  .setHeader('Expenses Overview')
  .setSubHeader('This Month')
  .setColor('#ef4444')
  .setBackgroundColor('#fef2f2')
  .setStyle({ 
    borderRadius: '12px', 
    padding: '20px',
    borderColor: '#fecaca',
    borderWidth: 2
  })
  .setLayout({ 
    flexDirection: 'column', 
    gap: '10px',
    justifyContent: 'center'
  })
  .setPosition({ x: 2, y: 0, cols: 2, rows: 2 })
  .build();
```

### Creating from Data Object

```typescript
const tileData = {
  value: '$3,750',
  change: '+12.5%',
  description: 'Net Profit',
  icon: 'fas fa-chart-pie',
  color: '#3b82f6',
  backgroundColor: '#eff6ff',
  title: 'Profit Metrics',
  subtitle: 'Q4 Results',
  data: { period: 'Q4', year: 2024 }
};

const widget = TileBuilder.createFromData(tileData)
  .setPosition({ x: 4, y: 0, cols: 2, rows: 2 })
  .build();
```

## Data Management

### Setting Generic Data

```typescript
const widget = TileBuilder.create()
  .setData({ 
    value: '$1,000', 
    change: '+5%', 
    type: 'revenue',
    period: 'Q1',
    timestamp: new Date().toISOString()
  })
  .setHeader('Dynamic Tile')
  .build();
```

### Setting Individual Properties

```typescript
const widget = TileBuilder.create()
  .setValue('$1,234')
  .setChange('+5.2%')
  .setChangeType('positive')
  .setDescription('Total Revenue')
  .setProperty('category', 'financial')
  .setProperty('priority', 'high')
  .build();
```

### Setting Multiple Properties

```typescript
const widget = TileBuilder.create()
  .setProperties({
    value: '$1,234',
    change: '+5.2%',
    category: 'financial',
    priority: 'high',
    lastUpdated: new Date().toISOString()
  })
  .build();
```

## Header Management

### Setting Headers

```typescript
const widget = TileBuilder.create()
  .setHeader('Revenue Metrics')
  .setSubHeader('Monthly Overview')
  .build();
```

### Setting Both Headers at Once

```typescript
const widget = TileBuilder.create()
  .setHeaders('Revenue Metrics', 'Monthly Overview')
  .build();
```

## Styling Options

### Colors and Backgrounds

```typescript
const widget = TileBuilder.create()
  .setColor('#10b981')
  .setBackgroundColor('#f0fdf4')
  .setIconColor('#059669')
  .build();
```

### Borders and Padding

```typescript
const widget = TileBuilder.create()
  .setBorder('#bbf7d0', 2, 12)
  .setPadding('20px')
  .setMargin('10px')
  .build();
```

### Typography

```typescript
const widget = TileBuilder.create()
  .setFont('1.2rem', '600')
  .setTextAlign('center')
  .build();
```

### Icons

```typescript
const widget = TileBuilder.create()
  .setIcon('fas fa-dollar-sign')
  .setIconSize('2.5rem')
  .setIconColor('#10b981')
  .build();
```

### Custom Style Object

```typescript
const widget = TileBuilder.create()
  .setStyle({
    borderRadius: '16px',
    padding: '24px',
    borderColor: '#374151',
    borderWidth: 2,
    fontSize: '1.1rem',
    fontWeight: '600',
    textAlign: 'center',
    iconSize: '3rem',
    iconColor: '#fbbf24'
  })
  .build();
```

## Layout Options

### Basic Layout

```typescript
const widget = TileBuilder.create()
  .setSize('300px', '200px')
  .setMinSize('250px', '150px')
  .setMaxSize('400px', '300px')
  .build();
```

### Flexbox Layout

```typescript
const widget = TileBuilder.create()
  .setFlexDirection('column')
  .setJustifyContent('center')
  .setAlignItems('center')
  .setGap('16px')
  .build();
```

### Custom Layout Object

```typescript
const widget = TileBuilder.create()
  .setLayout({
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%'
  })
  .build();
```

## Factory Methods

### Financial Tile

```typescript
const widget = TileBuilder.createFinancialTile(
  1250000, // amount
  8.5,     // change percent
  'Annual Revenue',
  '$',     // currency
  'fas fa-dollar-sign'
)
  .setHeader('Revenue Overview')
  .setSubHeader('Fiscal Year 2024')
  .setBackgroundColor('#f0fdf4')
  .setBorder('#bbf7d0', 1, 12)
  .build();
```

### Percentage Tile

```typescript
const widget = TileBuilder.createPercentageTile(
  75.5,    // percentage
  'Customer Satisfaction',
  'fas fa-smile',
  '#3b82f6'
)
  .setHeader('Satisfaction Score')
  .setSubHeader('Based on 1,234 responses')
  .setBackgroundColor('#eff6ff')
  .setTextAlign('center')
  .build();
```

### Info Tile

```typescript
const widget = TileBuilder.createInfoTile(
  'System Status',
  'Online',
  'All services operational',
  'fas fa-check-circle',
  '#10b981'
)
  .setBackgroundColor('#f0fdf4')
  .setBorder('#bbf7d0', 1, 8)
  .build();
```

### Status Tile

```typescript
const widget = TileBuilder.createStatusTile(
  'Database',
  'Connected',
  true,  // isActive
  'fas fa-database',
  '#3b82f6'
)
  .setSubHeader('Primary Server')
  .setBackgroundColor('#eff6ff')
  .build();
```

## Configuration Methods

### Core Properties

- `setValue(value: string | number)`: Set the main value to display
- `setChange(change: string)`: Set the change value (e.g., "+5.2%", "-2.1%")
- `setChangeType(type: 'positive' | 'negative' | 'neutral')`: Set the change type for styling
- `setDescription(description: string)`: Set the description text
- `setIcon(icon: string)`: Set the icon class (FontAwesome, Material Icons, etc.)
- `setColor(color: string)`: Set the tile color theme
- `setBackgroundColor(backgroundColor: string)`: Set the tile background color
- `setAccessor(accessor: string)`: Set the data accessor key for dynamic data binding

### Data Management

- `setData(data: any)`: Set generic data for the tile
- `setProperty(key: string, value: any)`: Set a custom property
- `setProperties(properties: Record<string, any>)`: Set multiple properties at once

### Header Management

- `setHeader(title: string, options?: string[])`: Set the tile header/title
- `setSubHeader(subtitle: string)`: Set the tile subtitle
- `setHeaders(title: string, subtitle?: string, options?: string[])`: Set both header and subheader

### Styling Methods

- `setColor(color: string)`: Set the tile color theme
- `setBackgroundColor(backgroundColor: string)`: Set the tile background color
- `setIcon(icon: string)`: Set the icon class
- `setIconSize(size: string)`: Set icon size
- `setIconColor(color: string)`: Set icon color
- `setBorder(color: string, width?: number, radius?: number)`: Set border properties
- `setPadding(padding: string)`: Set padding
- `setMargin(margin: string)`: Set margin
- `setFont(size: string, weight?: string)`: Set font properties
- `setTextAlign(align: 'left' | 'center' | 'right')`: Set text alignment
- `setStyle(style: Partial<TileStyleOptions>)`: Set custom style options

### Layout Methods

- `setPosition(position: { x: number; y: number; cols: number; rows: number })`: Set position and size
- `setSize(width: string, height: string)`: Set width and height
- `setMinSize(width: string, height: string)`: Set minimum dimensions
- `setMaxSize(width: string, height: string)`: Set maximum dimensions
- `setFlexDirection(direction: 'row' | 'column')`: Set flex direction
- `setJustifyContent(justify: string)`: Set justify content
- `setAlignItems(align: string)`: Set align items
- `setGap(gap: string)`: Set gap between elements
- `setLayout(layout: Partial<TileLayoutOptions>)`: Set custom layout options

### Events and State

- `setEvents(onDataLoad?: (widget: IWidget, data?: any) => void)`: Set event handlers
- `setInitialState(state: any)`: Set initial state
- `setState(state: any)`: Set current state

## Dynamic Updates

Update tile data after creation:

```typescript
const tile = TileBuilder.create()
  .setData({ 
    value: '$1,000', 
    change: '+5%', 
    type: 'revenue',
    period: 'Q1'
  })
  .setHeader('Dynamic Tile')
  .setSubHeader('Real-time Updates')
  .build();

// Update the tile data with new properties
TileBuilder.updateData(tile, {
  value: '$1,250',
  change: '+25%',
  title: 'Updated Metrics',
  subtitle: 'Q2 Results',
  backgroundColor: '#eff6ff',
  color: '#3b82f6'
});
```

## Export Functionality

Export tile data for Excel/CSV:

```typescript
const exportData = TileBuilder.exportData(widget);
const headers = TileBuilder.getExportHeaders(widget);
const sheetName = TileBuilder.getExportSheetName(widget);
```

## Interfaces

### TileData

```typescript
export interface TileData {
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  title?: string;
  subtitle?: string;
  data?: any;
  [key: string]: any;
}
```

### TileStyleOptions

```typescript
export interface TileStyleOptions {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  iconSize?: string;
  iconColor?: string;
}
```

### TileLayoutOptions

```typescript
export interface TileLayoutOptions {
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  display?: 'flex' | 'block' | 'inline-block';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
}
```

## Examples

See `tile-examples.ts` for comprehensive usage examples including:

- Basic tile creation with new methods
- Advanced styling and layout
- Factory method usage with enhanced styling
- Dashboard integration with new features
- Dynamic updates with new properties
- Event handling with custom properties
- Custom styled tiles

## Best Practices

1. **Use setData for Complex Data**: Use `setData()` for complex data structures
2. **Leverage Factory Methods**: Use factory methods for common tile types
3. **Consistent Styling**: Use consistent colors and styling across related tiles
4. **Meaningful Headers**: Provide clear, concise headers and subheaders
5. **Proper Layout**: Use appropriate layout options for different content types
6. **Dynamic Updates**: Use update methods for real-time data changes
7. **Custom Properties**: Use custom properties for application-specific data
8. **Export Support**: Include export functionality for data analysis

## Migration from Previous Version

If you're migrating from the previous tile builder:

**Before:**
```typescript
const widget = TileBuilder.create()
  .setValue('$1,234')
  .setChange('+5.2%')
  .setChangeType('positive')
  .setDescription('Total Revenue')
  .setIcon('fas fa-dollar-sign')
  .setColor('#10b981')
  .setHeader('Revenue Tile')
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

**After (Enhanced):**
```typescript
const widget = TileBuilder.create()
  .setData({ value: '$1,234', change: '+5.2%', type: 'revenue' })
  .setHeader('Revenue Metrics')
  .setSubHeader('Monthly Overview')
  .setColor('#10b981')
  .setBackgroundColor('#f0fdf4')
  .setBorder('#bbf7d0', 1, 12)
  .setLayout({ flexDirection: 'column', gap: '8px' })
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
``` 