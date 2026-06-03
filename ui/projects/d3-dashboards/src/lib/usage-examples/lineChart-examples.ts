import { LineChartBuilder, LineChartData } from '../echart-chart-builders/line/line-chart-builder';

/**
 * Line Chart Examples
 * This file provides example usage patterns for the LineChartBuilder
 */

// Sample data for line charts
export const sampleLineData: LineChartData[] = [
  { name: 'Jan', value: 10 },
  { name: 'Feb', value: 20 },
  { name: 'Mar', value: 30 },
  { name: 'Apr', value: 40 },
  { name: 'May', value: 50 },
  { name: 'Jun', value: 45 },
];

export const sampleLineDataSimple: number[] = [10, 20, 30, 40, 50, 45];

export const sampleXAxisData: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

/**
 * Example 1: Basic Line Chart
 */
export function createBasicLineChart() {
  return LineChartBuilder.create()
    .setData(sampleLineDataSimple)
    .setXAxisData(sampleXAxisData)
    .setHeader('Monthly Sales')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 2: Smooth Line Chart with Area
 */
export function createSmoothLineChart() {
  return LineChartBuilder.create()
    .setData(sampleLineDataSimple)
    .setXAxisData(sampleXAxisData)
    .setTitle('Portfolio Performance', 'Last 6 months')
    .setSmooth(true)
    .setAreaStyle('#5470c6', 0.3)
    .setLineStyle(3, '#5470c6', 'solid')
    .setSymbol('circle', 8)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Performance Chart')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 3: Multi-Series Line Chart
 */
export function createMultiSeriesLineChart() {
  const data1 = [10, 20, 30, 40, 50, 45];
  const data2 = [15, 25, 35, 45, 55, 50];
  const data3 = [5, 15, 25, 35, 45, 40];

  return LineChartBuilder.create()
    .setData(data1)
    .setXAxisData(sampleXAxisData)
    .setTitle('Multi-Series Performance', 'Comparison Chart')
    .setSmooth(true)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 6)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Multi-Series Chart')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 6 })
    .build();
}

/**
 * Example 4: Dashed Line Chart
 */
export function createDashedLineChart() {
  return LineChartBuilder.create()
    .setData(sampleLineDataSimple)
    .setXAxisData(sampleXAxisData)
    .setTitle('Dashed Line Chart', 'Example')
    .setLineStyle(2, '#91cc75', 'dashed')
    .setSymbol('diamond', 8)
    .setShowSymbol(true)
    .setTooltip('item', '{b}: {c}')
    .setHeader('Dashed Line Example')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 5: Line Chart with Custom Colors
 */
export function createCustomColorLineChart() {
  return LineChartBuilder.create()
    .setData(sampleLineDataSimple)
    .setXAxisData(sampleXAxisData)
    .setTitle('Custom Color Line Chart', 'Styled Example')
    .setColors(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'])
    .setLineStyle(3, '#ff6b6b', 'solid')
    .setSymbol('rect', 10)
    .setEmphasis(15, 2, 'rgba(255, 107, 107, 0.8)')
    .setTooltip('axis', '{b}: {c}')
    .setHeader('Custom Styled Line')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 5 })
    .build();
} 