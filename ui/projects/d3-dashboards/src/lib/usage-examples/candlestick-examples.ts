import { CandlestickChartBuilder } from '../echart-chart-builders';

/**
 * Basic Candlestick Chart Example
 * 
 * Creates a simple candlestick chart with OHLC data
 */
export function basicCandlestickExample() {
  // Sample stock data: [open, close, low, high] for each day
  const stockData = [
    [20, 34, 10, 38],     // Day 1: Open 20, Close 34, Low 10, High 38
    [40, 35, 30, 50],     // Day 2: Open 40, Close 35, Low 30, High 50
    [31, 38, 33, 44],     // Day 3: Open 31, Close 38, Low 33, High 44
    [38, 15, 5, 42],      // Day 4: Open 38, Close 15, Low 5, High 42
    [15, 25, 12, 28],     // Day 5: Open 15, Close 25, Low 12, High 28
  ];

  const dateLabels = [
    '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'
  ];

  return CandlestickChartBuilder.create()
    .setData(stockData)
    .setXAxisData(dateLabels)
    .setTitle('Basic Stock Chart', 'Daily OHLC Data')
    .setHeader('Basic Candlestick Example')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Advanced Candlestick Chart Example
 * 
 * Creates a comprehensive candlestick chart with all features enabled
 */
export function advancedCandlestickExample() {
  // Extended stock data for 20 days
  const stockData = [
    [85, 92, 78, 95],    [92, 88, 85, 98],    [88, 95, 82, 102],   [95, 87, 89, 100],
    [87, 93, 84, 98],    [93, 89, 88, 97],    [89, 96, 86, 101],   [96, 91, 90, 99],
    [91, 98, 87, 103],   [98, 94, 92, 105],   [94, 102, 89, 108],  [102, 97, 95, 110],
    [97, 105, 93, 112],  [105, 99, 101, 115], [99, 108, 96, 118],  [108, 103, 105, 120],
    [103, 112, 100, 122],[112, 107, 109, 125],[107, 115, 104, 128],[115, 110, 112, 130]
  ];

  // Generate 20 consecutive trading days
  const dateLabels = [];
  const startDate = new Date('2024-01-01');
  for (let i = 0; i < 20; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dateLabels.push(date.toISOString().split('T')[0]);
  }

  return CandlestickChartBuilder.create()
    .setData(stockData)
    .setXAxisData(dateLabels)
    .setTitle('Advanced Stock Analysis', 'Professional Trading Chart')
    .setXAxisName('Trading Date')
    .setYAxisName('Stock Price ($)')
    .setColors(['#d14a61', '#5cb85c'])    // Custom bull/bear colors
    .setBorderColors('#9d2933', '#449d44') // Custom border colors
    .setBarWidth('80%')
    .setBorderWidth(2)
    // Data zoom removed - using time range filters instead
    .enableBrush()                        // Enable data selection
    .setLargeMode(600)                    // Optimize for large datasets
    .setTooltip('axis')                   // Enhanced tooltip
    .setHeader('Advanced Candlestick Chart')
    .setPosition({ x: 0, y: 0, cols: 12, rows: 8 })
    .build();
}

/**
 * Minimal Candlestick Chart Example
 * 
 * Creates a simple chart with minimal configuration
 */
export function minimalCandlestickExample() {
  const data = [
    [100, 110, 95, 115],
    [110, 105, 100, 120],
    [105, 125, 102, 130]
  ];

  return CandlestickChartBuilder.create()
    .setData(data)
    .setHeader('Minimal Candlestick')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 3 })
    .build();
}

/**
 * Real-time Candlestick Chart Example
 * 
 * Demonstrates how to create a chart suitable for real-time updates
 */
export function realtimeCandlestickExample() {
  // Generate sample intraday data (every 15 minutes)
  const intradayData = [];
  const timeLabels = [];
  let basePrice = 150;
  
  for (let hour = 9; hour <= 16; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 16 && minute > 0) break; // Market closes at 4 PM
      
      const open = basePrice + (Math.random() - 0.5) * 2;
      const close = open + (Math.random() - 0.5) * 3;
      const low = Math.min(open, close) - Math.random() * 1.5;
      const high = Math.max(open, close) + Math.random() * 1.5;
      
      intradayData.push([open, close, low, high]);
      timeLabels.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      
      basePrice = close; // Use previous close as next base
    }
  }

  return CandlestickChartBuilder.create()
    .setData(intradayData)
    .setXAxisData(timeLabels)
    .setTitle('Intraday Trading', 'Real-time 15-minute intervals')
    .setXAxisName('Time')
    .setYAxisName('Price ($)')
    .setColors(['#ff4757', '#2ed573'])     // Bright colors for real-time
    .setBorderColors('#ff3838', '#20bf6b')
    // Data zoom removed - using time range filters instead
    .setLargeMode(200)                     // Optimize for many data points
    .setTooltip('axis')
    .setHeader('Real-time Candlestick Chart')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
}

/**
 * Crypto Candlestick Chart Example
 * 
 * Example styled for cryptocurrency trading
 */
export function cryptoCandlestickExample() {
  // Generate crypto-style volatile data
  const cryptoData = [];
  const dateLabels = [];
  let basePrice = 45000; // Starting at $45,000 (like Bitcoin)
  
  for (let i = 0; i < 30; i++) {
    const volatility = 0.05; // 5% daily volatility
    const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
    const close = open * (1 + (Math.random() - 0.5) * volatility * 1.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.8);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.8);
    
    cryptoData.push([
      Math.round(open * 100) / 100,
      Math.round(close * 100) / 100,
      Math.round(low * 100) / 100,
      Math.round(high * 100) / 100
    ]);
    
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + i);
    dateLabels.push(date.toISOString().split('T')[0]);
    
    basePrice = close; // Trend continuation
  }

  return CandlestickChartBuilder.create()
    .setData(cryptoData)
    .setXAxisData(dateLabels)
    .setTitle('BTC/USD', 'Daily cryptocurrency price action')
    .setXAxisName('Date')
    .setYAxisName('Price (USD)')
    .setColors(['#f39c12', '#27ae60'])     // Bitcoin-style colors
    .setBorderColors('#d68910', '#1e8449')
    .setBarWidth('70%')
    .setBorderWidth(1)
    // Data zoom removed - using time range filters instead
    .enableBrush()                         // Enable technical analysis selection
    .setTooltip('axis')
    .setHeader('Cryptocurrency Candlestick Chart')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
    .build();
}

/**
 * Usage Examples Summary
 * 
 * This file demonstrates various ways to use the CandlestickChartBuilder:
 * 
 * 1. Basic Example - Simple OHLC chart with minimal configuration
 * 2. Advanced Example - Full-featured chart with all options enabled
 * 3. Minimal Example - Bare minimum setup for quick prototyping
 * 4. Real-time Example - Optimized for frequent data updates
 * 5. Crypto Example - Styled for cryptocurrency trading applications
 * 
 * Key Features Demonstrated:
 * - Static OHLC data formatting: [open, close, low, high]
 * - X-axis date/time labeling
 * - Custom color schemes for bull/bear markets
 * - Data zoom for large datasets
 * - Brush selection for technical analysis
 * - Large data mode for performance optimization
 * - Various chart dimensions and positioning
 * - Professional styling for different trading contexts
 */ 