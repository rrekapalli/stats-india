# Stock Tile Component

The Stock Tile component is a specialized tile widget designed for displaying stock market data with high/low values positioned on the left and right sides of the tile. It provides a clean, professional layout for financial dashboards.

## Features

- **High/Low Display**: Shows day high and low values on the left and right sides
- **Center Content**: Main price, change percentage, and description in the center
- **Responsive Layout**: Flexible design that adapts to different tile sizes
- **Color Coding**: Automatic color coding for positive/negative changes
- **Currency Formatting**: Built-in currency formatting support
- **Real-time Updates**: Supports WebSocket updates for live data

## Layout Structure

```
┌─────────────────────────────────────────┐
│                    NIFTY METAL                 │
│                                                │
│        ₹15,234  +₹381.00 (+2.50%)             │
│                                                │
│  High: ₹15,500                 Low: ₹14,800   │
└─────────────────────────────────────────┘
```

## Usage

### Basic Usage

```typescript
import { StockTileBuilder } from '@dashboards/public-api';

// Create a basic stock tile
const stockTile = StockTileBuilder.create()
  .setValue('₹15,234')
  .setChange('+₹381.00 (+2.50%)')
  .setDescription('NIFTY METAL')
  .setHighValue('₹15,500')
  .setLowValue('₹14,800')
  .setCurrency('₹')
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

### Using the Convenience Method

```typescript
// Create stock tile with automatic formatting
const stockTile = StockTileBuilder.createStockTile(
  15234,        // current price
  2.5,          // percent change
  'NIFTY METAL', // description
  15500,        // high value
  14800,        // low value
  '₹'           // currency
)
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

### Creating from Data Object

```typescript
const stockData = {
  value: '₹15,234',
  change: '+2.5%',
  description: 'NIFTY METAL',
  highValue: '₹15,500',
  lowValue: '₹14,800',
  currency: '₹'
};

const stockTile = StockTileBuilder.createFromData(stockData)
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

## API Reference

### StockTileBuilder Methods

#### Static Methods

- `create()`: Creates a new StockTileBuilder instance
- `createFromData(data: StockTileData)`: Creates from a data object
- `createStockTile(currentPrice, percentChange, description, highValue, lowValue, currency)`: Convenience method for creating stock tiles

#### Instance Methods

- `setValue(value: string | number)`: Set the main price value
- `setChange(change: string)`: Set the change percentage
- `setChangeType(type: 'positive' | 'negative' | 'neutral')`: Set the change type for styling
- `setDescription(description: string)`: Set the stock/index description
- `setIcon(icon: string)`: Set the icon (FontAwesome class)
- `setColor(color: string)`: Set the text color
- `setBackgroundColor(color: string)`: Set the background color
- `setHighValue(value: string | number)`: Set the high value
- `setLowValue(value: string | number)`: Set the low value
- `setCurrency(currency: string)`: Set the currency symbol
- `setShowCurrency(show: boolean)`: Toggle currency display
- `setPosition(position: {x, y, cols, rows})`: Set the tile position
- `setBorder(color, width, radius)`: Set border styling
- `build()`: Build the final widget

### StockTileData Interface

```typescript
interface StockTileData {
  value?: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  subtitle?: string;
  highValue?: string;
  lowValue?: string;
  currency?: string;
  showCurrency?: boolean;
}
```

### IStockTileOptions Interface

```typescript
interface IStockTileOptions extends ITileOptions {
  highValue?: string;
  lowValue?: string;
  currency?: string;
  showCurrency?: boolean;
  formatHighLow?: (value: number) => string;
}
```

## Styling

The stock tile uses CSS Grid and Flexbox for responsive layout:

- **Left Side**: High value with label
- **Center**: Main price, description, change, and icon
- **Right Side**: Low value with label

### CSS Classes

- `.stock-tile-container`: Main container
- `.stock-tile-content`: Content wrapper
- `.stock-tile-symbol`: Stock symbol/name (top center, small font)
- `.stock-tile-main-section`: Main content section (price and change)
- `.stock-tile-price-line`: Price and change on same line
- `.stock-tile-price`: Main price display
- `.stock-tile-change`: Change value (smaller font)
- `.stock-tile-high-low-section`: Bottom section with high/low values
- `.stock-tile-high`, `.stock-tile-low`: High/low value containers
- `.stock-tile-high-label`, `.stock-tile-low-label`: High/low labels (small font)
- `.stock-tile-high-value`, `.stock-tile-low-value`: High/low values (small font)

## Integration with Dashboard

The stock tile integrates seamlessly with the dashboard system:

1. **Widget Registry**: Automatically registered in the widget component
2. **Filter Support**: Works with the dashboard filtering system
3. **WebSocket Updates**: Supports real-time data updates
4. **Export Support**: Included in Excel export functionality

## Examples

### In Overall Dashboard

The stock tile is used for the first metric tile in the overall dashboard:

```typescript
// In metric-tiles.ts
tiles.push(
  StockTileBuilder.createStockTile(
    lastPrice,
    percentChange,
    indexName,
    dayHigh,
    dayLow,
    '₹'
  )
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .build()
);
```

### Custom Styling

```typescript
const customStockTile = StockTileBuilder.create()
  .setValue('$1,234.56')
  .setChange('-$14.81 (-1.20%)')
  .setDescription('AAPL')
  .setHighValue('$1,250.00')
  .setLowValue('$1,200.00')
  .setCurrency('$')
  .setColor('#dc2626')
  .setBackgroundColor('#fef2f2')
  .setBorder('#f87171', 2, 12)
  .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
  .build();
```

## Updating Stock Tiles

To update stock tile data dynamically:

```typescript
import { StockTileBuilder } from '@dashboards/public-api';

// Update existing widget
StockTileBuilder.updateData(widget, {
  value: '₹15,500',
  change: '+3.2%',
  highValue: '₹15,600',
  lowValue: '₹14,900'
});
```

## Best Practices

1. **Use the convenience method** `createStockTile()` for standard stock tiles
2. **Set appropriate colors** based on positive/negative changes
3. **Use consistent currency formatting** across your dashboard
4. **Position tiles appropriately** in the dashboard grid
5. **Handle WebSocket updates** for real-time data

## Browser Support

The stock tile component supports all modern browsers with CSS Grid and Flexbox support:
- Chrome 57+
- Firefox 52+
- Safari 10.1+
- Edge 16+ 