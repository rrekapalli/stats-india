import { 
  StackedAreaChartBuilder, 
  StackedAreaSeriesData,
  StandardDashboardBuilder,
  DashboardConfig 
} from '../../public-api';

/**
 * Example 1: Basic Stacked Area Chart
 * Simple stacked area chart with three series
 */
export function createBasicStackedAreaChartExample(): any {
  const data: StackedAreaSeriesData[] = [
    {
      name: 'Revenue',
      data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]
    },
    {
      name: 'Expenses',
      data: [80, 92, 71, 94, 60, 180, 160, 132, 141, 184, 240, 280]
    },
    {
      name: 'Profit',
      data: [40, 40, 30, 40, 30, 50, 50, 50, 50, 50, 50, 50]
    }
  ];

  const xAxisData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return StackedAreaChartBuilder.create()
    .setMultiSeriesData(data)
    .setXAxisData(xAxisData)
    .setTitle('Financial Overview', 'Revenue vs Expenses vs Profit')
    .setSmooth(true)
    .setStack('total')
    .setColors(['#5470c6', '#91cc75', '#fac858'])
    .setAreaStyle('#5470c6', 0.6)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 5)
    .setTooltip('axis', '{b}: ${c}K')
    .setLegend('horizontal', 'bottom')
    .setHeader('Financial Overview')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 2: Portfolio Allocation Stacked Area Chart
 * Shows asset allocation over time
 */
export function createPortfolioAllocationStackedAreaChartExample(): any {
  const data: StackedAreaSeriesData[] = [
    {
      name: 'Stocks',
      data: [45, 52, 48, 61, 55, 68, 72, 65, 78, 82, 75, 88]
    },
    {
      name: 'Bonds',
      data: [25, 28, 22, 35, 30, 42, 38, 32, 45, 48, 40, 52]
    },
    {
      name: 'Cash',
      data: [15, 18, 12, 25, 20, 32, 28, 22, 35, 38, 30, 42]
    },
    {
      name: 'Real Estate',
      data: [15, 12, 18, 9, 15, 10, 12, 15, 8, 12, 15, 10]
    }
  ];

  const xAxisData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return StackedAreaChartBuilder.create()
    .setMultiSeriesData(data)
    .setXAxisData(xAxisData)
    .setTitle('Portfolio Allocation', 'Asset Class Distribution Over Time')
    .setSmooth(true)
    .setStack('total')
    .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666'])
    .setAreaStyle('#5470c6', 0.7)
    .setLineStyle(1, '#5470c6', 'solid')
    .setSymbol('circle', 4)
    .setTooltip('axis', '{b}: {c}%')
    .setLegend('horizontal', 'bottom')
    .setHeader('Portfolio Allocation')
    .setPosition({ x: 0, y: 4, cols: 8, rows: 4 })
    .build();
}

/**
 * Example 3: Market Conditions Stacked Area Chart
 * Shows market sentiment over time
 */
export function createMarketConditionsStackedAreaChartExample(): any {
  const data: StackedAreaSeriesData[] = [
    {
      name: 'Bull Market',
      data: [60, 65, 70, 75, 80, 85, 90, 85, 80, 75, 70, 65]
    },
    {
      name: 'Bear Market',
      data: [20, 15, 10, 5, 0, 0, 0, 5, 10, 15, 20, 25]
    },
    {
      name: 'Sideways',
      data: [20, 20, 20, 20, 20, 15, 10, 10, 10, 10, 10, 10]
    }
  ];

  const xAxisData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return StackedAreaChartBuilder.create()
    .setMultiSeriesData(data)
    .setXAxisData(xAxisData)
    .setTitle('Market Conditions', 'Market Sentiment Analysis')
    .setSmooth(true)
    .setStack('total')
    .setColors(['#91cc75', '#ee6666', '#fac858'])
    .setAreaStyle('#91cc75', 0.6)
    .setLineStyle(2, '#91cc75', 'solid')
    .setSymbol('circle', 5)
    .setTooltip('axis', '{b}: {c}%')
    .setLegend('horizontal', 'bottom')
    .setHeader('Market Conditions')
    .setPosition({ x: 8, y: 0, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 4: Sales Performance Stacked Area Chart
 * Shows sales performance by region
 */
export function createSalesPerformanceStackedAreaChartExample(): any {
  const data: StackedAreaSeriesData[] = [
    {
      name: 'North America',
      data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]
    },
    {
      name: 'Europe',
      data: [80, 92, 71, 94, 60, 180, 160, 132, 141, 184, 240, 280]
    },
    {
      name: 'Asia Pacific',
      data: [60, 72, 51, 74, 40, 130, 110, 82, 91, 134, 190, 230]
    },
    {
      name: 'Latin America',
      data: [40, 52, 31, 54, 20, 80, 60, 32, 41, 84, 140, 180]
    }
  ];

  const xAxisData = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return StackedAreaChartBuilder.create()
    .setMultiSeriesData(data)
    .setXAxisData(xAxisData)
    .setTitle('Sales Performance', 'Regional Sales Distribution')
    .setSmooth(true)
    .setStack('total')
    .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666'])
    .setGradientAreaStyle('#5470c6', '#91cc75', 0.6)
    .setLineStyle(2, '#5470c6', 'solid')
    .setSymbol('circle', 5)
    .setTooltip('axis', '{b}: ${c}K')
    .setLegend('horizontal', 'bottom')
    .setHeader('Sales Performance')
    .setPosition({ x: 8, y: 4, cols: 4, rows: 4 })
    .build();
}

/**
 * Example 5: Complete Dashboard with Stacked Area Charts
 * Creates a dashboard with multiple stacked area charts
 */
export function createStackedAreaChartDashboardExample(): DashboardConfig {
  const basicStackedArea = createBasicStackedAreaChartExample();
  const portfolioAllocation = createPortfolioAllocationStackedAreaChartExample();
  const marketConditions = createMarketConditionsStackedAreaChartExample();
  const salesPerformance = createSalesPerformanceStackedAreaChartExample();

  return StandardDashboardBuilder.createStandard()
    .setDashboardId('stacked-area-dashboard')
    .setWidgets([
      basicStackedArea,
      portfolioAllocation,
      marketConditions,
      salesPerformance
    ])
    .setEditMode(false)
    .build();
}

/**
 * Example 6: Large Dataset Stacked Area Chart
 * Demonstrates performance with large datasets using sampling
 */
export function createLargeDatasetStackedAreaChartExample(): any {
  // Generate large dataset for performance demonstration
  const generateLargeDataset = (baseValue: number, variance: number): number[] => {
    return Array.from({ length: 500 }, (_, i) => 
      baseValue + Math.sin(i * 0.1) * variance + Math.random() * 20
    );
  };

  const data: StackedAreaSeriesData[] = [
    {
      name: 'Series A',
      data: generateLargeDataset(100, 30)
    },
    {
      name: 'Series B',
      data: generateLargeDataset(80, 25)
    },
    {
      name: 'Series C',
      data: generateLargeDataset(60, 20)
    }
  ];

  const xAxisData = Array.from({ length: 500 }, (_, i) => `Point ${i + 1}`);

  return StackedAreaChartBuilder.create()
    .setMultiSeriesData(data)
    .setXAxisData(xAxisData)
    .setTitle('Large Dataset Performance', '500 data points with sampling')
    .setSmooth(true)
    .setSampling('average')
    .setStack('total')
    .setColors(['#5470c6', '#91cc75', '#fac858'])
    .setAreaStyle('#5470c6', 0.4)
    .setLineStyle(1, '#5470c6', 'solid')
    .setShowSymbol(false)
    .setTooltip('axis', '{b}: {c}')
    .setLegend('horizontal', 'bottom')
    .setHeader('Large Dataset Performance')
    .setPosition({ x: 0, y: 8, cols: 12, rows: 4 })
    .build();
} 