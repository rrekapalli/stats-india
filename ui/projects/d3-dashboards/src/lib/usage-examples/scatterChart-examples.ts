import { ScatterChartBuilder, ScatterChartData } from '../echart-chart-builders/scatter/scatter-chart-builder';

/**
 * Scatter Chart Examples
 * This file provides example usage patterns for the ScatterChartBuilder
 */

// Sample data for scatter charts
export const sampleScatterData: ScatterChartData[] = [
  { value: [10, 20], name: 'Point 1' },
  { value: [15, 25], name: 'Point 2' },
  { value: [20, 30], name: 'Point 3' },
  { value: [25, 35], name: 'Point 4' },
  { value: [30, 40], name: 'Point 5' },
  { value: [35, 45], name: 'Point 6' },
  { value: [40, 50], name: 'Point 7' },
  { value: [45, 55], name: 'Point 8' },
];

export const sampleRiskReturnData: ScatterChartData[] = [
  { value: [0.1, 0.05], name: 'Low Risk, Low Return' },
  { value: [0.2, 0.08], name: 'Medium Risk, Medium Return' },
  { value: [0.3, 0.12], name: 'High Risk, High Return' },
  { value: [0.15, 0.06], name: 'Conservative' },
  { value: [0.25, 0.10], name: 'Balanced' },
  { value: [0.35, 0.15], name: 'Aggressive' },
];

/**
 * Example 1: Basic Scatter Chart
 */
export function createBasicScatterChart() {
  return ScatterChartBuilder.create()
    .setData(sampleScatterData)
    .setHeader('Data Distribution')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 2: Risk vs Return Scatter Chart
 */
export function createRiskReturnScatterChart() {
  return ScatterChartBuilder.create()
    .setData(sampleRiskReturnData)
    .setTitle('Portfolio Risk vs Return', 'Scatter Analysis')
    .setXAxisName('Risk')
    .setYAxisName('Return')
    .setSymbol('circle', 10)
    .setItemStyle('#5470c6', 0.8, '#fff', 1)
    .setTooltip('item', '{b}: ({c})')
    .setLegend('horizontal', 'bottom')
    .setHeader('Risk-Return Analysis')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 3: Large Scatter Chart with Optimization
 */
export function createLargeScatterChart() {
  // Generate large dataset
  const largeData: ScatterChartData[] = [];
  for (let i = 0; i < 1000; i++) {
    largeData.push({
      value: [Math.random() * 100, Math.random() * 100],
      name: `Point ${i + 1}`,
    });
  }

  return ScatterChartBuilder.create()
    .setData(largeData)
    .setTitle('Large Dataset Scatter', 'Performance Optimized')
    .setXAxisName('X Axis')
    .setYAxisName('Y Axis')
    .setSymbol('circle', 4)
    .setItemStyle('#91cc75', 0.6)
    .setLargeScatter(true, 2000)
    .setProgressive(1000, 3000)
    .setTooltip('item', '{b}: ({c})')
    .setHeader('Large Scatter Chart')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
}

/**
 * Example 4: Custom Symbol Scatter Chart
 */
export function createCustomSymbolScatterChart() {
  return ScatterChartBuilder.create()
    .setData(sampleScatterData)
    .setTitle('Custom Symbol Scatter', 'Different Shapes')
    .setXAxisName('X Values')
    .setYAxisName('Y Values')
    .setSymbol('diamond', 12)
    .setItemStyle('#fac858', 0.9, '#fff', 2)
    .setEmphasis(20, 5, 'rgba(250, 200, 88, 0.8)')
    .setTooltip('item', '{b}: ({c})')
    .setHeader('Custom Symbol Chart')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 5: Multi-Color Scatter Chart
 */
export function createMultiColorScatterChart() {
  const multiColorData: ScatterChartData[] = [
    { value: [10, 20], name: 'Group A', itemStyle: { color: '#5470c6' } },
    { value: [15, 25], name: 'Group A', itemStyle: { color: '#5470c6' } },
    { value: [20, 30], name: 'Group A', itemStyle: { color: '#5470c6' } },
    { value: [25, 35], name: 'Group B', itemStyle: { color: '#91cc75' } },
    { value: [30, 40], name: 'Group B', itemStyle: { color: '#91cc75' } },
    { value: [35, 45], name: 'Group B', itemStyle: { color: '#91cc75' } },
    { value: [40, 50], name: 'Group C', itemStyle: { color: '#fac858' } },
    { value: [45, 55], name: 'Group C', itemStyle: { color: '#fac858' } },
  ];

  return ScatterChartBuilder.create()
    .setData(multiColorData)
    .setTitle('Multi-Color Scatter', 'Grouped Data')
    .setXAxisName('X Axis')
    .setYAxisName('Y Axis')
    .setSymbol('circle', 10)
    .setItemStyle('#5470c6', 0.8)
    .setTooltip('item', '{b}: ({c})')
    .setLegend('horizontal', 'bottom')
    .setHeader('Multi-Color Scatter')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 5 })
    .build();
} 