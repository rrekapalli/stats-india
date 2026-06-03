import { PolarChartBuilder, PolarChartData } from '../echart-chart-builders/polar';
import { IWidget } from '../entities/IWidget';

/**
 * Basic Polar Chart Example
 * Creates a simple polar chart with default settings
 */
export function createBasicPolarChart(): IWidget {
  const data = [80, 65, 90, 75, 85, 70, 95, 60];
  
  return PolarChartBuilder.create()
    .setData(data)
    .setTitle('Basic Polar Chart', 'Simple 360-degree view')
    .setHeader('Basic Polar Chart')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Advanced Polar Chart Example
 * Creates a polar chart with custom styling and configuration
 */
export function createAdvancedPolarChart(): IWidget {
  const data = [85, 70, 95, 80, 90, 75, 100, 65];
  
  return PolarChartBuilder.create()
    .setData(data)
    .setTitle('Performance Metrics', 'Advanced 360-degree view')
    .setPolarCenter(['50%', '50%'])
    .setPolarRadius(['25%', '75%'])
    .setStartAngle(0)
    .setEndAngle(360)
    .setSmooth(true)
    .setGradientAreaStyle('#5470c6', '#91cc75', 0.4)
    .setLineStyle(3, '#5470c6', 'solid')
    .setSymbol('circle', 8)
    .setTooltip('item', '{b}: {c}%')
    .setLegend('horizontal', 'bottom')
    .setHeader('Performance Metrics')
    .setPosition({ x: 6, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Multi-Series Polar Chart Example
 * Creates a polar chart with multiple data series
 */
export function createMultiSeriesPolarChart(): IWidget {
  const multiSeriesData = [
    { name: 'Current', data: [80, 65, 90, 75, 85, 70, 95, 60] },
    { name: 'Target', data: [90, 75, 95, 85, 90, 80, 100, 70] },
    { name: 'Previous', data: [70, 55, 80, 65, 75, 60, 85, 50] }
  ];
  
  return PolarChartBuilder.create()
    .setData(multiSeriesData)
    .setTitle('Financial Performance', 'Current vs Target vs Previous')
    .setPolarCenter(['50%', '50%'])
    .setPolarRadius(['20%', '70%'])
    .setStartAngle(0)
    .setEndAngle(360)
    .setSmooth(true)
    .setAreaStyle('#5470c6', 0.3)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 6)
    .setTooltip('item', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Financial Performance')
    .setPosition({ x: 0, y: 4, cols: 8, rows: 4 })
    .build();
}

/**
 * Radar-Style Polar Chart Example
 * Creates a polar chart that looks like a radar/spider chart
 */
export function createRadarPolarChart(): IWidget {
  const radarData = [
    { name: 'Revenue', value: 85 },
    { name: 'Profit', value: 70 },
    { name: 'Growth', value: 90 },
    { name: 'Efficiency', value: 75 },
    { name: 'Innovation', value: 80 },
    { name: 'Market Share', value: 65 }
  ];
  
  return PolarChartBuilder.create()
    .setData(radarData.map(item => item.value))
    .setTitle('Business Metrics', 'Radar view of key performance indicators')
    .setPolarCenter(['50%', '50%'])
    .setPolarRadius(['15%', '65%'])
    .setStartAngle(0)
    .setEndAngle(360)
    .setSmooth(true)
    .setGradientAreaStyle('#ff6b6b', '#4ecdc4', 0.4)
    .setLineStyle(3, '#ff6b6b', 'solid')
    .setSymbol('diamond', 8)
    .setTooltip('item', '{b}: {c}%')
    .setLegend('horizontal', 'bottom')
    .setHeader('Business Metrics')
    .setPosition({ x: 6, y: 4, cols: 6, rows: 4 })
    .build();
}

/**
 * Partial Polar Chart Example
 * Creates a polar chart with a partial angle range (e.g., 180 degrees)
 */
export function createPartialPolarChart(): IWidget {
  const data = [60, 75, 85, 70, 90, 65];
  
  return PolarChartBuilder.create()
    .setData(data)
    .setTitle('Partial View', '180-degree polar chart')
    .setPolarCenter(['50%', '50%'])
    .setPolarRadius(['30%', '80%'])
    .setStartAngle(0)
    .setEndAngle(180)
    .setSmooth(true)
    .setAreaStyle('#fac858', 0.5)
    .setLineStyle(2, '#fac858', 'solid')
    .setSymbol('rect', 6)
    .setTooltip('item', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Partial View')
    .setPosition({ x: 0, y: 8, cols: 6, rows: 4 })
    .build();
}

/**
 * Large Dataset Polar Chart Example
 * Creates a polar chart with many data points and sampling
 */
export function createLargeDatasetPolarChart(): IWidget {
  // Generate large dataset for performance demonstration
  const largeDataset = Array.from({ length: 100 }, (_, i) => ({
    name: `Point ${i + 1}`,
    value: Math.random() * 100 + Math.sin(i * 0.1) * 20 + 50
  }));
  
  return PolarChartBuilder.create()
    .setData(largeDataset.map(item => item.value))
    .setTitle('Large Dataset', '100 data points with sampling')
    .setPolarCenter(['50%', '50%'])
    .setPolarRadius(['20%', '70%'])
    .setStartAngle(0)
    .setEndAngle(360)
    .setSmooth(true)
    .setSampling('average')
    .setGradientAreaStyle('#ee6666', '#73c0de', 0.3)
    .setLineStyle(1, '#ee6666', 'solid')
    .setShowSymbol(false)
    .setTooltip('item', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Large Dataset')
    .setPosition({ x: 6, y: 8, cols: 6, rows: 4 })
    .build();
}

/**
 * Stacked Polar Chart Example
 * Creates a stacked polar chart for comparing multiple series
 */
export function createStackedPolarChart(): IWidget {
  const stackedData = [
    { name: 'Series A', data: [30, 25, 40, 35, 45, 30, 50, 25] },
    { name: 'Series B', data: [20, 15, 30, 25, 35, 20, 40, 15] },
    { name: 'Series C', data: [10, 5, 20, 15, 25, 10, 30, 5] }
  ];
  
  return PolarChartBuilder.create()
    .setData(stackedData)
    .setTitle('Stacked Comparison', 'Multiple series stacked view')
    .setPolarCenter(['50%', '50%'])
    .setPolarRadius(['25%', '75%'])
    .setStartAngle(0)
    .setEndAngle(360)
    .setSmooth(true)
    .setStack('total')
    .setAreaStyle('#5470c6', 0.6)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 5)
    .setTooltip('item', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Stacked Comparison')
    .setPosition({ x: 0, y: 12, cols: 8, rows: 4 })
    .build();
}

/**
 * Sample data for polar charts
 */
export const samplePolarData: PolarChartData[] = [
  { name: '0°', value: 80 },
  { name: '45°', value: 65 },
  { name: '90°', value: 90 },
  { name: '135°', value: 75 },
  { name: '180°', value: 85 },
  { name: '225°', value: 70 },
  { name: '270°', value: 95 },
  { name: '315°', value: 60 }
];

/**
 * Alternative sample data for polar charts
 */
export const alternativePolarData: PolarChartData[] = [
  { name: 'Q1', value: 75 },
  { name: 'Q2', value: 85 },
  { name: 'Q3', value: 90 },
  { name: 'Q4', value: 80 },
  { name: 'Q5', value: 95 },
  { name: 'Q6', value: 70 }
]; 