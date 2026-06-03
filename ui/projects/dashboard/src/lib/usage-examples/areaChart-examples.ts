import { AreaChartBuilder, AreaChartData } from '../echart-chart-builders/area';
import { WidgetBuilder } from '../widgets/widget/widget-builder';

// Sample data for area charts
export const sampleAreaDataSimple = [10, 20, 30, 40, 50, 60];
export const sampleAreaXAxisData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const sampleAreaDataComplex: AreaChartData[] = [
  { name: 'Jan', value: 10 },
  { name: 'Feb', value: 20 },
  { name: 'Mar', value: 30 },
  { name: 'Apr', value: 40 },
  { name: 'May', value: 50 },
  { name: 'Jun', value: 60 },
];

export const sampleMultiSeriesData = [
  { name: 'Revenue', data: [10, 20, 30, 40, 50, 60] },
  { name: 'Expenses', data: [5, 15, 25, 35, 45, 55] },
  { name: 'Profit', data: [5, 5, 5, 5, 5, 5] },
];

export const sampleLargeDataset = Array.from({ length: 1000 }, (_, i) => ({
  name: `Point ${i + 1}`,
  value: Math.random() * 100 + Math.sin(i * 0.1) * 20,
}));

/**
 * Example 1: Basic Area Chart
 */
export function createBasicAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleAreaDataSimple)
    .setXAxisData(sampleAreaXAxisData)
    .setHeader('Basic Area Chart')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 2: Smooth Area Chart with Gradient
 */
export function createSmoothAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleAreaDataSimple)
    .setXAxisData(sampleAreaXAxisData)
    .setTitle('Portfolio Performance', 'Last 6 months')
    .setSmooth(true)
    .setGradientAreaStyle('#5470c6', '#91cc75', 0.4)
    .setLineStyle(3, '#5470c6', 'solid')
    .setSymbol('circle', 8)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Performance Chart')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 3: Stacked Area Chart
 */
export function createStackedAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleMultiSeriesData)
    .setXAxisData(sampleAreaXAxisData)
    .setTitle('Financial Overview', 'Revenue vs Expenses vs Profit')
    .setSmooth(true)
    .setStack('total')
    .setAreaStyle('#5470c6', 0.6)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 6)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Financial Overview')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
}

/**
 * Example 4: Large Scale Area Chart with Sampling
 */
export function createLargeScaleAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleLargeDataset.map(item => item.value))
    .setXAxisData(sampleLargeDataset.map(item => item.name))
    .setTitle('Large Scale Data Visualization', '1000 data points with sampling')
    .setSmooth(true)
    .setSampling('average')
    .setGradientAreaStyle('#ff6b6b', '#4ecdc4', 0.3)
    .setLineStyle(1, '#ff6b6b', 'solid')
    .setShowSymbol(false)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Large Scale Area Chart')
    .setPosition({ x: 0, y: 0, cols: 12, rows: 6 })
    .build();
}

/**
 * Example 5: Multi-Series Area Chart
 */
export function createMultiSeriesAreaChart() {
  return AreaChartBuilder.create()
    .setData([
      { name: 'Series A', data: [10, 20, 30, 40, 50, 60] },
      { name: 'Series B', data: [5, 15, 25, 35, 45, 55] },
      { name: 'Series C', data: [15, 25, 35, 45, 55, 65] },
    ])
    .setXAxisData(sampleAreaXAxisData)
    .setTitle('Multi-Series Comparison', 'Three different metrics')
    .setSmooth(true)
    .setAreaStyle('#5470c6', 0.4)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 6)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Multi-Series Area Chart')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 5 })
    .build();
}

/**
 * Example 6: Area Chart with Custom Colors
 */
export function createCustomColorAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleAreaDataSimple)
    .setXAxisData(sampleAreaXAxisData)
    .setTitle('Custom Styled Area Chart', 'With custom colors and styling')
    .setSmooth(true)
    .setAreaStyle('#ff6b6b', 0.5)
    .setLineStyle(4, '#ff6b6b', 'solid')
    .setSymbol('diamond', 10)
    .setItemStyle('#ff6b6b', '#fff', 2)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Custom Area Chart')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 7: Area Chart with No Symbols
 */
export function createCleanAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleAreaDataSimple)
    .setXAxisData(sampleAreaXAxisData)
    .setTitle('Clean Area Chart', 'Minimal design without symbols')
    .setSmooth(true)
    .setAreaStyle('#91cc75', 0.3)
    .setLineStyle(2, '#91cc75', 'solid')
    .setShowSymbol(false)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Clean Area Chart')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 8: Legacy Widget Builder Pattern
 */
export function createLegacyAreaChartWidget(): WidgetBuilder {
  return AreaChartBuilder.createAreaChartWidget(sampleAreaDataSimple, sampleAreaXAxisData)
    .setHeader('Legacy Area Chart')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 });
}

/**
 * Example 9: Area Chart with Complex Data
 */
export function createComplexAreaChart() {
  return AreaChartBuilder.create()
    .setData(sampleAreaDataComplex)
    .setXAxisData(sampleAreaDataComplex.map(item => item.name))
    .setTitle('Complex Data Area Chart', 'With structured data objects')
    .setSmooth(true)
    .setGradientAreaStyle('#667eea', '#764ba2', 0.4)
    .setLineStyle(3, '#667eea', 'solid')
    .setSymbol('circle', 8)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Complex Area Chart')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 10: Performance Monitoring Area Chart
 */
export function createPerformanceAreaChart() {
  const performanceData = [
    { name: 'CPU', data: [45, 52, 38, 67, 58, 49] },
    { name: 'Memory', data: [30, 35, 28, 45, 42, 38] },
    { name: 'Disk', data: [15, 18, 12, 25, 22, 20] },
  ];

  return AreaChartBuilder.create()
    .setData(performanceData)
    .setXAxisData(['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'])
    .setTitle('System Performance', '24-hour monitoring')
    .setSmooth(true)
    .setStack('total')
    .setAreaStyle('#ff6b6b', 0.6)
    .setLineStyle(2, '#ff6b6b', 'solid')
    .setSymbol('circle', 6)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Performance Monitoring')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
} 