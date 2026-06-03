# Candlestick Chart Builder

The `CandlestickChartBuilder` provides a fluent API for creating professional financial candlestick charts using Apache ECharts. This chart type is specifically designed for displaying Open, High, Low, Close (OHLC) price data commonly used in financial markets.

## Overview

Based on the [Apache ECharts Candlestick example](https://echarts.apache.org/examples/en/editor.html?c=candlestick-brush), this implementation provides:

- **Professional OHLC Data Visualization**: Display stock, forex, crypto, or any financial data
- **Interactive Features**: Data zoom, brush selection, cross-hair tooltips
- **Customizable Styling**: Bull/bear colors, border styles, bar width
- **Performance Optimization**: Large data mode for high-frequency trading data
- **Real-time Ready**: Optimized for dynamic data updates

## Basic Usage

```typescript
import { CandlestickChartBuilder } from '@dashboards/public-api';

// Sample OHLC data: [open, close, low, high] for each period
const stockData = [
  [20, 34, 10, 38],     // Open: 20, Close: 34, Low: 10, High: 38
  [40, 35, 30, 50],     // Open: 40, Close: 35, Low: 30, High: 50
  [31, 38, 33, 44],     // Open: 31, Close: 38, Low: 33, High: 44
];

const dateLabels = ['2024-01-15', '2024-01-16', '2024-01-17'];

const widget = CandlestickChartBuilder.create()
  .setData(stockData)
  .setXAxisData(dateLabels)
  .setTitle('Stock Performance', 'Daily OHLC Data')
  .setHeader('My Stock Chart')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
  .build();
```

## Data Format

Candlestick charts expect data in a specific OHLC format:

```typescript
// Each data point is an array: [open, close, low, high]
const ohlcData = [
  [openPrice, closePrice, lowPrice, highPrice],
  // ... more data points
];

// Example with real values
const stockData = [
  [100.50, 105.25, 98.75, 107.00],  // Bullish candle (close > open)
  [105.25, 102.80, 101.50, 106.00], // Bearish candle (close < open)
];
```

## Configuration Options

### Colors and Styling

```typescript
CandlestickChartBuilder.create()
  .setColors(['#ec0000', '#00da3c'])        // [bull color, bear color]
  .setBorderColors('#8A0000', '#008F28')    // bull border, bear border
  .setBarWidth('60%')                       // Candle width
  .setBorderWidth(2)                        // Border thickness
```

### Interactive Features

```typescript
CandlestickChartBuilder.create()
  .enableDataZoom(50, 100)                  // Show last 50% by default
  .enableBrush()                            // Enable data selection
  .setLargeMode(600)                        // Optimize for 600+ points
```

### Axes Configuration

```typescript
CandlestickChartBuilder.create()
  .setXAxisName('Trading Date')
  .setYAxisName('Price ($)')
  .setXAxisData(dateLabels)
```

### Tooltips

```typescript
CandlestickChartBuilder.create()
  .setTooltip('axis')  // Shows crosshair with OHLC values
```

## Advanced Examples

### Professional Trading Chart

```typescript
const tradingChart = CandlestickChartBuilder.create()
  .setData(ohlcData)
  .setXAxisData(timestamps)
  .setTitle('AAPL Stock Analysis', 'Real-time trading data')
  .setXAxisName('Time')
  .setYAxisName('Price (USD)')
  .setColors(['#d14a61', '#5cb85c'])        // Custom bull/bear colors
  .setBorderColors('#9d2933', '#449d44')    // Matching borders
  .setBarWidth('80%')
  .setBorderWidth(1)
  .enableDataZoom(70, 100)                  // Focus on recent data
  .enableBrush()                            // Enable technical analysis
  .setLargeMode(1000)                       // Handle large datasets
  .setTooltip('axis')
  .setHeader('Professional Trading Chart')
  .setPosition({ x: 0, y: 0, cols: 12, rows: 8 })
  .build();
```

### Cryptocurrency Chart

```typescript
const cryptoChart = CandlestickChartBuilder.create()
  .setData(btcPriceData)
  .setXAxisData(dateLabels)
  .setTitle('BTC/USD', '24h cryptocurrency price action')
  .setColors(['#f39c12', '#27ae60'])        // Bitcoin-themed colors
  .setBorderColors('#d68910', '#1e8449')
  .enableDataZoom(80, 100)                  // Show recent activity
  .enableBrush()
  .setHeader('Bitcoin Price Chart')
  .build();
```

### Intraday Trading Chart

```typescript
const intradayChart = CandlestickChartBuilder.create()
  .setData(minuteData)
  .setXAxisData(timeLabels)  // ['09:30', '09:45', '10:00', ...]
  .setTitle('Intraday Trading', '15-minute intervals')
  .setColors(['#ff4757', '#2ed573'])        // High-contrast colors
  .enableDataZoom(90, 100)                  // Focus on latest activity
  .setLargeMode(500)                        // Optimize for many intervals
  .setHeader('Intraday Chart')
  .build();
```

## Features

### 🎯 Market-Ready Styling
- Traditional green/red or custom bull/bear color schemes
- Configurable border colors and widths
- Professional financial chart appearance

### 📊 Interactive Analysis
- **Data Zoom**: Focus on specific time periods with mouse wheel or slider
- **Brush Selection**: Select data ranges for detailed analysis
- **Cross-hair Tooltips**: Precise OHLC value display

### ⚡ Performance Optimized
- **Large Data Mode**: Handles thousands of data points efficiently
- **Incremental Updates**: Optimized for real-time data streams
- **Memory Efficient**: Smart rendering for high-frequency data

### 🛠️ Developer Friendly
- **Fluent API**: Chainable method calls for clean code
- **Type Safety**: Full TypeScript support with proper interfaces
- **Static Methods**: Easy data export and chart type detection

## Data Sources

The candlestick chart works well with various financial data sources:

```typescript
// Stock market data
const stockOHLC = [
  [150.25, 152.80, 149.50, 153.10],  // Strong bullish movement
  [152.80, 151.45, 150.00, 154.20],  // Consolidation
];

// Forex data (currency pairs)
const forexOHLC = [
  [1.2050, 1.2085, 1.2040, 1.2090],  // EUR/USD
  [1.2085, 1.2070, 1.2060, 1.2095],
];

// Cryptocurrency data
const cryptoOHLC = [
  [45250.50, 46180.25, 44800.00, 46500.75],  // High volatility
  [46180.25, 45920.80, 45200.50, 47100.20],
];
```

## Export Functionality

The candlestick chart supports Excel/CSV export:

```typescript
// Export OHLC data
const exportData = CandlestickChartBuilder.exportData(widget);
// Returns: [{ Date: '2024-01-15', Open: 20, High: 38, Low: 10, Close: 34 }, ...]

const headers = CandlestickChartBuilder.getExportHeaders(widget);
// Returns: ['Date', 'Open', 'High', 'Low', 'Close']

const sheetName = CandlestickChartBuilder.getExportSheetName(widget);
// Returns: 'Candlestick Chart' or widget title
```

## Technical Analysis Integration

The candlestick chart is designed to work with technical analysis tools:

### Volume Integration
```typescript
// Combine with volume bars for complete analysis
const candlestickWidget = CandlestickChartBuilder.create()
  .setData(ohlcData)
  .enableBrush()  // Select periods for volume correlation
  .build();

const volumeWidget = BarChartBuilder.create()
  .setData(volumeData)
  .setPosition({ x: 0, y: 6, cols: 8, rows: 2 })  // Below candlesticks
  .build();
```

### Indicator Overlay
```typescript
// Enable brush selection for indicator calculations
const chartWithIndicators = CandlestickChartBuilder.create()
  .setData(ohlcData)
  .enableBrush()  // Users can select periods for RSI, MACD, etc.
  .enableDataZoom(50, 100)  // Zoom for detailed analysis
  .build();
```

## Best Practices

### 1. **Data Preparation**
```typescript
// Ensure data is properly formatted and sorted by time
const sortedData = rawData
  .sort((a, b) => a.timestamp - b.timestamp)
  .map(item => [item.open, item.close, item.low, item.high]);
```

### 2. **Performance**
```typescript
// For large datasets, enable large mode
if (dataPoints.length > 500) {
  builder.setLargeMode(500);
}
```

### 3. **Real-time Updates**
```typescript
// Update data efficiently for live trading
CandlestickChartBuilder.updateData(widget, newOHLCData);
```

### 4. **Color Schemes**
```typescript
// Use consistent color schemes across your application
const BULL_COLOR = '#00da3c';  // Green for rising prices
const BEAR_COLOR = '#ec0000';  // Red for falling prices
```

## Browser Support

The candlestick chart works in all modern browsers that support Apache ECharts:
- Chrome 39+
- Firefox 30+
- Safari 9+
- Edge 12+

## Related Charts

- **Line Chart**: For simple price trends without OHLC details
- **Bar Chart**: For volume or other financial metrics
- **Area Chart**: For portfolio value over time
- **Scatter Plot**: For correlation analysis between instruments 