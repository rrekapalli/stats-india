import { IWidget } from '../entities/IWidget';
import { PieChartBuilder, PieChartData } from '../echart-chart-builders/pie/pie-chart-builder';

/**
 * Examples demonstrating the usage of PieChartBuilder class
 */

// Sample data for examples
const sampleData: PieChartData[] = [
  { value: 45, name: 'Stocks' },
  { value: 25, name: 'Bonds' },
  { value: 15, name: 'Cash' },
  { value: 10, name: 'Real Estate' },
  { value: 5, name: 'Commodities' },
];

/**
 * Example 1: Basic pie chart with default options
 */
export function createBasicPieChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setHeader('Asset Allocation')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 2: Custom styled pie chart
 */
export function createCustomStyledPieChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setTitle('Portfolio Distribution', 'As of December 2024')
    .setRadius(['40%', '70%'])
    .setCenter(['50%', '60%'])
    .setLabelFormatter('{b}: {c} ({d}%)')
    .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'])
    .setBorderRadius(8)
    .setBorder('#fff', 2)
    .setTooltip('item', '{b}: {c} ({d}%)')
    .setLegend('horizontal', 'bottom')
    .setHeader('Custom Pie Chart')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 3: Donut chart with emphasis effects
 */
export function createDonutChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setRadius(['50%', '80%'])
    .setCenter(['50%', '50%'])
    .setLabelShow(false)
    .setColors(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'])
    .setEmphasis(20, 0, 'rgba(0, 0, 0, 0.7)')
    .setTooltip('item', '{b}: ${c} ({d}%)')
    .setLegend('vertical', 'right')
    .setHeader('Donut Chart')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 4: Compact pie chart for small spaces
 */
export function createCompactPieChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setRadius('60%')
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{d}%')
    .setLabelPosition('inside')
    .setColors(['#ff9999', '#99ccff', '#99ff99', '#ffcc99', '#cc99ff'])
    .setGrid({ top: '10%', bottom: '10%' })
    .setHeader('Compact View')
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Example 5: Pie chart with custom grid and positioning
 */
export function createCustomGridPieChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setTitle('Investment Breakdown')
    .setRadius(['30%', '55%'])
    .setCenter(['50%', '55%'])
    .setLabelFormatter('{b}\n{c}%')
    .setColors(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'])
    .setGrid({ 
      top: '20%', 
      left: '10%', 
      right: '10%', 
      bottom: '20%',
      height: '60%'
    })
    .setLegend('horizontal', 'bottom')
    .setHeader('Investment Portfolio')
    .setPosition({ x: 0, y: 0, cols: 5, rows: 5 })
    .build();
}

/**
 * Example 6: Dynamic data update demonstration
 */
export function createDynamicPieChart(): IWidget {
  const widget = PieChartBuilder.create()
    .setData(sampleData)
    .setHeader('Dynamic Chart')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();

  // Example of updating data dynamically
  setTimeout(() => {
    const updatedData: PieChartData[] = [
      { value: 50, name: 'Stocks' },
      { value: 20, name: 'Bonds' },
      { value: 20, name: 'Cash' },
      { value: 8, name: 'Real Estate' },
      { value: 2, name: 'Commodities' },
    ];
    
    // Update the widget data
    PieChartBuilder.updateData(widget, updatedData);
  }, 5000);

  return widget;
}

/**
 * Example 7: Pie chart with custom tooltip and legend styling
 */
export function createStyledPieChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setTitle('Financial Portfolio', 'Monthly Update')
    .setRadius(['35%', '65%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}\n${c}')
    .setColors(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'])
    .setBorderRadius(4)
    .setBorder('#fff', 1)
    .setTooltip('item', (params: any) => {
      return `${params.name}<br/>Value: $${params.value}<br/>Percentage: ${params.percent}%`;
    })
    .setLegend('vertical', 'left')
    .setHeader('Financial Overview')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 8: Minimal pie chart with no labels
 */
export function createMinimalPieChart(): IWidget {
  return PieChartBuilder.create()
    .setData(sampleData)
    .setRadius('70%')
    .setCenter(['50%', '50%'])
    .setLabelShow(false)
    .setColors(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'])
    .setGrid({ top: '5%', bottom: '5%' })
    .setHeader('Minimal Chart')
    .setPosition({ x: 0, y: 0, cols: 3, rows: 3 })
    .build();
} 