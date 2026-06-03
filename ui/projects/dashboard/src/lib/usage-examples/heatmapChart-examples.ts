import { HeatmapChartBuilder, HeatmapChartData } from '../echart-chart-builders/heatmap/heatmap-chart-builder';

/**
 * Heatmap Chart Examples
 * This file provides example usage patterns for the HeatmapChartBuilder
 */

// Sample data for heatmap charts
export const sampleHeatmapData: HeatmapChartData[] = [
  { value: [0, 0, 5], name: 'Mon-Morning' },
  { value: [1, 0, 7], name: 'Tue-Morning' },
  { value: [2, 0, 3], name: 'Wed-Morning' },
  { value: [3, 0, 8], name: 'Thu-Morning' },
  { value: [4, 0, 6], name: 'Fri-Morning' },
  { value: [0, 1, 4], name: 'Mon-Afternoon' },
  { value: [1, 1, 9], name: 'Tue-Afternoon' },
  { value: [2, 1, 2], name: 'Wed-Afternoon' },
  { value: [3, 1, 7], name: 'Thu-Afternoon' },
  { value: [4, 1, 5], name: 'Fri-Afternoon' },
  { value: [0, 2, 6], name: 'Mon-Evening' },
  { value: [1, 2, 8], name: 'Tue-Evening' },
  { value: [2, 2, 4], name: 'Wed-Evening' },
  { value: [3, 2, 9], name: 'Thu-Evening' },
  { value: [4, 2, 3], name: 'Fri-Evening' },
];

export const samplePortfolioData: HeatmapChartData[] = [
  { value: [0, 0, 85], name: 'Tech-High' },
  { value: [1, 0, 92], name: 'Finance-High' },
  { value: [2, 0, 78], name: 'Healthcare-High' },
  { value: [3, 0, 88], name: 'Energy-High' },
  { value: [0, 1, 72], name: 'Tech-Medium' },
  { value: [1, 1, 85], name: 'Finance-Medium' },
  { value: [2, 1, 65], name: 'Healthcare-Medium' },
  { value: [3, 1, 79], name: 'Energy-Medium' },
  { value: [0, 2, 58], name: 'Tech-Low' },
  { value: [1, 2, 73], name: 'Finance-Low' },
  { value: [2, 2, 52], name: 'Healthcare-Low' },
  { value: [3, 2, 68], name: 'Energy-Low' },
];

/**
 * Example 1: Basic Heatmap Chart
 */
export function createBasicHeatmapChart() {
  return HeatmapChartBuilder.create()
    .setData(sampleHeatmapData)
    .setXAxisData(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    .setYAxisData(['Morning', 'Afternoon', 'Evening'])
    .setHeader('Weekly Activity Heatmap')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 2: Portfolio Performance Heatmap
 */
export function createPortfolioHeatmapChart() {
  return HeatmapChartBuilder.create()
    .setData(samplePortfolioData)
    .setXAxisData(['Tech', 'Finance', 'Healthcare', 'Energy'])
    .setYAxisData(['High Risk', 'Medium Risk', 'Low Risk'])
    .setTitle('Portfolio Performance Heatmap', 'Risk vs Sector Analysis')
    .setVisualMap(50, 100, ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'])
    .setXAxisName('Sectors')
    .setYAxisName('Risk Levels')
    .setTooltip('item', '{b}: {c}%')
    .setHeader('Portfolio Heatmap')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
}

/**
 * Example 3: Custom Color Heatmap
 */
export function createCustomColorHeatmapChart() {
  return HeatmapChartBuilder.create()
    .setData(sampleHeatmapData)
    .setXAxisData(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    .setYAxisData(['Morning', 'Afternoon', 'Evening'])
    .setTitle('Custom Color Heatmap', 'Activity Levels')
    .setVisualMap(0, 10, ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'])
    .setVisualMapPosition('vertical', 'right', 'center')
    .setXAxisName('Days')
    .setYAxisName('Time Periods')
    .setItemStyle('#fff', 2)
    .setTooltip('item', '{b}: {c}')
    .setHeader('Custom Color Heatmap')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
}

/**
 * Example 4: Large Dataset Heatmap
 */
export function createLargeHeatmapChart() {
  // Generate large dataset
  const largeData: HeatmapChartData[] = [];
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      largeData.push({
        value: [i, j, Math.floor(Math.random() * 100)],
        name: `Cell ${i}-${j}`,
      });
    }
  }

  const xAxisLabels = Array.from({ length: 20 }, (_, i) => `X${i + 1}`);
  const yAxisLabels = Array.from({ length: 20 }, (_, i) => `Y${i + 1}`);

  return HeatmapChartBuilder.create()
    .setData(largeData)
    .setXAxisData(xAxisLabels)
    .setYAxisData(yAxisLabels)
    .setTitle('Large Dataset Heatmap', 'Performance Optimized')
    .setVisualMap(0, 100, ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'])
    .setXAxisName('X Categories')
    .setYAxisName('Y Categories')
    .setItemStyle('#fff', 1)
    .setProgressive(500, 2000)
    .setAnimation(false)
    .setTooltip('item', '{b}: {c}')
    .setHeader('Large Heatmap')
    .setPosition({ x: 0, y: 0, cols: 12, rows: 8 })
    .build();
}

/**
 * Example 5: Minimal Heatmap Chart
 */
export function createMinimalHeatmapChart() {
  return HeatmapChartBuilder.create()
    .setData(sampleHeatmapData)
    .setXAxisData(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
    .setYAxisData(['Morning', 'Afternoon', 'Evening'])
    .setTitle('Minimal Heatmap', 'Clean Design')
    .setVisualMap(0, 10, ['#f0f0f0', '#d0d0d0', '#b0b0b0', '#909090', '#707070', '#505050', '#303030', '#101010'])
    .setVisualMapPosition('horizontal', 'center', 'top')
    .setXAxisName('')
    .setYAxisName('')
    .setItemStyle('#fff', 0)
    .setTooltip('item', '{c}')
    .setHeader('Minimal Heatmap')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
} 