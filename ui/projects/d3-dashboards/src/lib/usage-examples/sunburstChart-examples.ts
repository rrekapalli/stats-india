import { SunburstChartBuilder, SunburstChartData } from '../echart-chart-builders/sunburst';

// Sample hierarchical data for sunburst chart examples
export const sampleSunburstData: SunburstChartData[] = [
  {
    name: 'Financial Portfolio',
    children: [
      {
        name: 'Stocks',
        value: 40,
        children: [
          { name: 'Technology', value: 15, itemStyle: { color: '#5470c6' } },
          { name: 'Healthcare', value: 10, itemStyle: { color: '#91cc75' } },
          { name: 'Finance', value: 8, itemStyle: { color: '#fac858' } },
          { name: 'Consumer', value: 7, itemStyle: { color: '#ee6666' } }
        ]
      },
      {
        name: 'Bonds',
        value: 30,
        children: [
          { name: 'Government', value: 15, itemStyle: { color: '#73c0de' } },
          { name: 'Corporate', value: 10, itemStyle: { color: '#3ba272' } },
          { name: 'Municipal', value: 5, itemStyle: { color: '#fc8452' } }
        ]
      },
      {
        name: 'Real Estate',
        value: 20,
        children: [
          { name: 'Residential', value: 12, itemStyle: { color: '#9a60b4' } },
          { name: 'Commercial', value: 8, itemStyle: { color: '#ea7ccc' } }
        ]
      },
      {
        name: 'Cash',
        value: 10,
        itemStyle: { color: '#f4e001' }
      }
    ]
  }
];

export const alternativeSunburstData: SunburstChartData[] = [
  {
    name: 'Company Structure',
    children: [
      {
        name: 'Engineering',
        value: 50,
        children: [
          { name: 'Frontend', value: 20, itemStyle: { color: '#5470c6' } },
          { name: 'Backend', value: 18, itemStyle: { color: '#91cc75' } },
          { name: 'DevOps', value: 12, itemStyle: { color: '#fac858' } }
        ]
      },
      {
        name: 'Sales',
        value: 25,
        children: [
          { name: 'Enterprise', value: 15, itemStyle: { color: '#ee6666' } },
          { name: 'SMB', value: 10, itemStyle: { color: '#73c0de' } }
        ]
      },
      {
        name: 'Marketing',
        value: 15,
        children: [
          { name: 'Digital', value: 10, itemStyle: { color: '#3ba272' } },
          { name: 'Content', value: 5, itemStyle: { color: '#fc8452' } }
        ]
      },
      {
        name: 'Support',
        value: 10,
        itemStyle: { color: '#9a60b4' }
      }
    ]
  }
];

/**
 * Example 1: Basic Sunburst Chart
 * Creates a simple sunburst chart with default settings
 */
export function createBasicSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(sampleSunburstData)
    .setHeader('Portfolio Allocation')
    .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 2: Customized Sunburst Chart
 * Creates a sunburst chart with custom styling and configuration
 */
export function createCustomizedSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(sampleSunburstData)
    .setTitle('Financial Portfolio', 'Hierarchical Breakdown')
    .setRadius(['20%', '90%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}')
    .setLevels([
      {
        itemStyle: {
          borderWidth: 2,
          borderColor: '#777',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#555',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#333',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('vertical', 'left')
    .setHeader('Custom Portfolio View')
    .setPosition({ x: 4, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 3: Organizational Structure Sunburst
 * Creates a sunburst chart for organizational hierarchy
 */
export function createOrganizationalSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(alternativeSunburstData)
    .setTitle('Organizational Structure', 'Department Distribution')
    .setRadius(['15%', '85%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}')
    .setLevels([
      {
        itemStyle: {
          borderWidth: 3,
          borderColor: '#999',
        },
      },
      {
        itemStyle: {
          borderWidth: 2,
          borderColor: '#666',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#333',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('vertical', 'right')
    .setHeader('Company Structure')
    .setPosition({ x: 8, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 4: Large Scale Sunburst Chart
 * Creates a large sunburst chart with maximum radius
 */
export function createLargeScaleSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(sampleSunburstData)
    .setTitle('Financial Overview', 'Complete Portfolio Breakdown')
    .setRadius(['10%', '95%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}')
    .setLevels([
      {
        itemStyle: {
          borderWidth: 4,
          borderColor: '#888',
        },
      },
      {
        itemStyle: {
          borderWidth: 2,
          borderColor: '#555',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#222',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('horizontal', 'bottom')
    .setHeader('Financial Overview')
    .setPosition({ x: 0, y: 4, cols: 6, rows: 4 })
    .build();
}

/**
 * Example 5: Animated Sunburst Chart
 * Creates a sunburst chart with custom animation settings
 */
export function createAnimatedSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(sampleSunburstData)
    .setTitle('Animated Portfolio', 'Dynamic Visualization')
    .setRadius(['25%', '85%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}')
    .setAnimationDuration(2000)
    .setAnimationEasing('elasticOut')
    .setLevels([
      {
        itemStyle: {
          borderWidth: 2,
          borderColor: '#777',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#555',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#333',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('vertical', 'left')
    .setHeader('Animated Portfolio')
    .setPosition({ x: 12, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 6: Minimal Sunburst Chart
 * Creates a minimal sunburst chart with simplified styling
 */
export function createMinimalSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(sampleSunburstData)
    .setRadius(['30%', '80%'])
    .setCenter(['50%', '50%'])
    .setLabelShow(false)
    .setLevels([
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#ccc',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('horizontal', 'bottom')
    .setHeader('Minimal Portfolio View')
    .setPosition({ x: 0, y: 8, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 7: Sorted Sunburst Chart
 * Creates a sunburst chart with custom sorting
 */
export function createSortedSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(sampleSunburstData)
    .setTitle('Sorted Portfolio', 'Value-based Sorting')
    .setRadius(['20%', '90%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}')
    .setSort('asc')
    .setLevels([
      {
        itemStyle: {
          borderWidth: 2,
          borderColor: '#777',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#555',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#333',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('vertical', 'right')
    .setHeader('Sorted Portfolio')
    .setPosition({ x: 4, y: 8, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 8: Compact Sunburst Chart
 * Creates a compact sunburst chart with smaller radius
 */
export function createCompactSunburstExample() {
  return SunburstChartBuilder.create()
    .setData(alternativeSunburstData)
    .setTitle('Compact Structure', 'Space-efficient View')
    .setRadius(['40%', '70%'])
    .setCenter(['50%', '50%'])
    .setLabelFormatter('{b}')
    .setLevels([
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#666',
        },
      },
      {
        itemStyle: {
          borderWidth: 1,
          borderColor: '#444',
        },
      },
    ])
    .setTooltip('item', '{b}: {c}%')
    .setLegend('vertical', 'left')
    .setHeader('Compact Structure')
    .setPosition({ x: 8, y: 8, cols: 4, rows: 4 })
    .build();
} 