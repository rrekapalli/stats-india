import { GaugeChartBuilder, GaugeChartData } from '../echart-chart-builders/gauge/gauge-chart-builder';

/**
 * Gauge Chart Examples
 * This file provides example usage patterns for the GaugeChartBuilder
 */

// Sample data for gauge charts
export const sampleGaugeData: GaugeChartData[] = [
  { value: 75, name: 'Progress' },
];

export const samplePerformanceData: GaugeChartData[] = [
  { value: 85, name: 'Portfolio Performance' },
];

export const sampleSavingsData: GaugeChartData[] = [
  { value: 60, name: 'Savings Goal' },
];

/**
 * Example 1: Basic Gauge Chart
 */
export function createBasicGaugeChart() {
  return GaugeChartBuilder.create()
    .setData(sampleGaugeData)
    .setHeader('Savings Goal Progress')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 2: Performance Gauge Chart
 */
export function createPerformanceGaugeChart() {
  return GaugeChartBuilder.create()
    .setData(samplePerformanceData)
    .setTitle('Portfolio Performance', 'Current Year')
    .setRange(0, 100)
    .setRadius('60%')
    .setCenter(['50%', '60%'])
    .setProgress(true, 10)
    .setPointer(true, '80%', 6)
    .setAxisLine(20, [[0.3, '#ff6e76'], [0.7, '#fddd60'], [1, '#58d9f9']])
    .setDetail(true, [0, 40], '#333', 20, '{value}%')
    .setGaugeTitle(true, [0, 70], '#333', 16)
    .setHeader('Performance Gauge')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 3: Custom Range Gauge Chart
 */
export function createCustomRangeGaugeChart() {
  return GaugeChartBuilder.create()
    .setData([{ value: 2500, name: 'Monthly Budget' }])
    .setTitle('Monthly Budget Usage', 'Current Month')
    .setRange(0, 3000)
    .setRadius('70%')
    .setCenter(['50%', '60%'])
    .setProgress(true, 15)
    .setPointer(true, '70%', 8)
    .setAxisLine(25, [[0.5, '#91cc75'], [0.8, '#fac858'], [1, '#ee6666']])
    .setDetail(true, [0, 40], '#333', 18, '${value}')
    .setGaugeTitle(true, [0, 70], '#333', 14)
    .setAxisTick(true, 6, 10, 2, '#999')
    .setSplitLine(true, 30, 4, '#999')
    .setHeader('Budget Gauge')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 4: Minimal Gauge Chart
 */
export function createMinimalGaugeChart() {
  return GaugeChartBuilder.create()
    .setData(sampleSavingsData)
    .setTitle('Savings Progress', 'Minimal Design')
    .setRadius('50%')
    .setCenter(['50%', '60%'])
    .setProgress(false)
    .setPointer(true, '60%', 4)
    .setAxisLine(15, [[0.6, '#91cc75'], [1, '#ee6666']])
    .setDetail(true, [0, 30], '#333', 24, '{value}%')
    .setGaugeTitle(false)
    .setAxisTick(false)
    .setSplitLine(false)
    .setAxisLabel(false)
    .setHeader('Minimal Gauge')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 5: Full Circle Gauge Chart
 */
export function createFullCircleGaugeChart() {
  return GaugeChartBuilder.create()
    .setData([{ value: 90, name: 'Completion Rate' }])
    .setTitle('Project Completion', 'Full Circle Gauge')
    .setAngles(0, 360)
    .setRadius('60%')
    .setCenter(['50%', '50%'])
    .setProgress(true, 12)
    .setPointer(true, '75%', 6)
    .setAxisLine(20, [[0.7, '#91cc75'], [0.9, '#fac858'], [1, '#ee6666']])
    .setDetail(true, [0, 0], '#333', 28, '{value}%')
    .setGaugeTitle(true, [0, 80], '#333', 16)
    .setAxisTick(true, 10, 8, 1, '#ccc')
    .setSplitLine(true, 25, 2, '#ccc')
    .setHeader('Full Circle Gauge')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
} 