import { 
  BarChartBuilder, 
  PieChartBuilder, 
  LineChartBuilder,
  CandlestickChartBuilder,
  ChartFilterEvent,
  TimeRangeFilterEvent
} from '../public-api';

/**
 * Examples demonstrating the generalized filtering system
 * that can be used across all chart builders
 */

/**
 * Example 1: Bar Chart with Category Filter
 */
export function createBarChartWithCategoryFilter() {
  const barChart = BarChartBuilder.create()
    .setData([
      { category: 'Electronics', value: 1200 },
      { category: 'Clothing', value: 800 },
      { category: 'Books', value: 600 },
      { category: 'Sports', value: 400 }
    ])
    .setHeader('Sales by Category')
    .setFilterChangeCallback((event: ChartFilterEvent) => {
      if (event.type === 'customFilter' && event.filterType === 'category') {
        // Handle category filter logic here
      }
    })
    .setEvents((widget, chart) => {
      // Add custom category filter buttons
      if (chart) {
        const categories = ['Electronics', 'Clothing', 'Books', 'Sports'];
        const filterButtons = categories.map((category, index) => ({
          type: 'rect',
          left: 10 + (index * 80),
          top: 10,
          width: 70,
          height: 25,
          style: {
            fill: '#f0f0f0',
            stroke: '#ccc',
            lineWidth: 1,
            borderRadius: 4
          },
          filterType: 'category',
          filterValue: category,
          cursor: 'pointer'
        }));

        const filterTexts = categories.map((category, index) => ({
          type: 'text',
          left: 10 + (index * 80) + 35,
          top: 10 + 12,
          style: {
            text: category,
            fill: '#333',
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'center',
            textVerticalAlign: 'middle'
          },
          filterType: 'category',
          filterValue: category,
          cursor: 'pointer'
        }));

        const currentOptions = chart.getOption();
        const newOptions = {
          ...currentOptions,
          graphic: [...filterButtons, ...filterTexts]
        };
        chart.setOption(newOptions, true);
      }
    })
    .build();

  return barChart;
}

/**
 * Example 2: Pie Chart with Sector Filter
 */
export function createPieChartWithSectorFilter() {
  const pieChart = PieChartBuilder.create()
    .setData([
      { sector: 'Technology', value: 45 },
      { sector: 'Finance', value: 30 },
      { sector: 'Healthcare', value: 15 },
      { sector: 'Energy', value: 10 }
    ])
    .setHeader('Portfolio Allocation')
    .setFilterChangeCallback((event: ChartFilterEvent) => {
      if (event.type === 'customFilter' && event.filterType === 'sector') {
        // Handle sector filter logic here
      }
    })
    .setEvents((widget, chart) => {
      // Add custom sector filter buttons
      if (chart) {
        const sectors = ['Technology', 'Finance', 'Healthcare', 'Energy'];
        const filterButtons = sectors.map((sector, index) => ({
          type: 'rect',
          left: 10 + (index * 70),
          top: 10,
          width: 60,
          height: 25,
          style: {
            fill: '#e3f2fd',
            stroke: '#2196f3',
            lineWidth: 1,
            borderRadius: 4
          },
          filterType: 'sector',
          filterValue: sector,
          cursor: 'pointer'
        }));

        const filterTexts = sectors.map((sector, index) => ({
          type: 'text',
          left: 10 + (index * 70) + 30,
          top: 10 + 12,
          style: {
            text: sector,
            fill: '#1976d2',
            fontSize: 9,
            fontWeight: 'bold',
            textAlign: 'center',
            textVerticalAlign: 'middle'
          },
          filterType: 'sector',
          filterValue: sector,
          cursor: 'pointer'
        }));

        const currentOptions = chart.getOption();
        const newOptions = {
          ...currentOptions,
          graphic: [...filterButtons, ...filterTexts]
        };
        chart.setOption(newOptions, true);
      }
    })
    .build();

  return pieChart;
}

/**
 * Example 3: Line Chart with Date Range Filter
 */
export function createLineChartWithDateRangeFilter() {
  const lineChart = LineChartBuilder.create()
    .setData([
      { date: '2024-01', value: 100 },
      { date: '2024-02', value: 120 },
      { date: '2024-03', value: 110 },
      { date: '2024-04', value: 140 }
    ])
    .setHeader('Monthly Trends')
    .setFilterChangeCallback((event: ChartFilterEvent) => {
      if (event.type === 'customFilter' && event.filterType === 'dateRange') {
        // Handle date range filter logic here
      }
    })
    .setEvents((widget, chart) => {
      // Add custom date range filter buttons
      if (chart) {
        const dateRanges = ['1M', '3M', '6M', '1Y'];
        const filterButtons = dateRanges.map((range, index) => ({
          type: 'rect',
          left: 10 + (index * 50),
          top: 10,
          width: 40,
          height: 25,
          style: {
            fill: '#f3e5f5',
            stroke: '#9c27b0',
            lineWidth: 1,
            borderRadius: 4
          },
          filterType: 'dateRange',
          filterValue: range,
          cursor: 'pointer'
        }));

        const filterTexts = dateRanges.map((range, index) => ({
          type: 'text',
          left: 10 + (index * 50) + 20,
          top: 10 + 12,
          style: {
            text: range,
            fill: '#7b1fa2',
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'center',
            textVerticalAlign: 'middle'
          },
          filterType: 'dateRange',
          filterValue: range,
          cursor: 'pointer'
        }));

        const currentOptions = chart.getOption();
        const newOptions = {
          ...currentOptions,
          graphic: [...filterButtons, ...filterTexts]
        };
        chart.setOption(newOptions, true);
      }
    })
    .build();

  return lineChart;
}

/**
 * Example 4: Candlestick Chart with Time Range Filter (using existing implementation)
 */
export function createCandlestickChartWithTimeRangeFilter() {
  const candlestickChart = CandlestickChartBuilder.create()
    .setData([])
    .setHeader('Stock Price Movement')
    .enableTimeRangeFilters()
    .setTimeRangeChangeCallback((event: TimeRangeFilterEvent) => {
      // Handle time range filter logic here
    })
    .build();

  return candlestickChart;
}

/**
 * Example 5: Generic Filter Handler for Dashboard Components
 */
export function createGenericFilterHandler() {
  return {
    handleFilterChange: (event: ChartFilterEvent) => {
      // Handle different filter types
      switch (event.filterType) {
        case 'category':
          // Implement category filtering logic
          break;
        case 'sector':
          // Implement sector filtering logic
          break;
        case 'dateRange':
          // Implement date range filtering logic
          break;
        case 'timeRange':
          // Implement time range filtering logic
          break;
        default:
      }
    }
  };
}
