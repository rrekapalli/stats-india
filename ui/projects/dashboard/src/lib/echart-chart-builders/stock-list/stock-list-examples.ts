import { StockListChartBuilder, StockListData } from './stock-list-chart-builder';

/**
 * Example usage of StockListChartBuilder
 */
export class StockListExamples {
  
  /**
   * Basic stock list chart example
   */
  static createBasicStockListChart(): any {
    const sampleData: StockListData[] = [
      {
        symbol: 'RELIANCE',
        companyName: 'Reliance Industries Limited',
        lastPrice: 2456.75,
        priceChange: 23.50,
        percentChange: 0.97,
        volume: 1234567,
        dayHigh: 2478.90,
        dayLow: 2445.20,
        openPrice: 2450.00,
        previousClose: 2433.25,
        industry: 'Oil & Gas',
        sector: 'Energy'
      },
      {
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services Limited',
        lastPrice: 3567.80,
        priceChange: -15.25,
        percentChange: -0.43,
        volume: 987654,
        dayHigh: 3590.00,
        dayLow: 3555.50,
        openPrice: 3580.00,
        previousClose: 3583.05,
        industry: 'Information Technology',
        sector: 'IT'
      },
      {
        symbol: 'INFY',
        companyName: 'Infosys Limited',
        lastPrice: 1456.30,
        priceChange: 8.75,
        percentChange: 0.60,
        volume: 2345678,
        dayHigh: 1465.00,
        dayLow: 1445.80,
        openPrice: 1450.00,
        previousClose: 1447.55,
        industry: 'Information Technology',
        sector: 'IT'
      }
    ];

    return StockListChartBuilder
      .create()
      .setData(sampleData)
      .setStockPerformanceConfiguration()
      .build();
  }

  /**
   * Stock comparison chart example
   */
  static createStockComparisonChart(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(15);

    return builder
      .setData(sampleData)
      .setStockComparisonConfiguration()
      .setColors(['#26a69a', '#ef5350', '#5470c6', '#91cc75', '#fac858'])
      .build();
  }

  /**
   * Volume analysis chart example
   */
  static createVolumeAnalysisChart(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(20);

    return builder
      .setData(sampleData)
      .setVolumeAnalysisConfiguration()
      .setBarWidth(30)
      .setBarBorderRadius([4, 4, 0, 0])
      .build();
  }

  /**
   * Filtered stock list example
   */
  static createFilteredStockList(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(25);

    return builder
      .setData(sampleData)
      .setStockPerformanceConfiguration()
      .transformData({
        filters: [
          {
            column: 'industry',
            operator: 'equals',
            value: 'Technology'
          }
        ],
        sortBy: 'percentChange',
        sortOrder: 'desc',
        limit: 10
      });
  }

  /**
   * Dataset encode configuration example
   */
  static createDatasetEncodeChart(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(12);

    return builder
      .setData(sampleData)
      .setDatasetEncodeConfiguration()
      .build();
  }

  /**
   * Custom styled stock chart example
   */
  static createCustomStyledChart(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(8);

    return builder
      .setData(sampleData)
      .setStockPerformanceConfiguration()
      .setColors(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'])
      .setBarWidth('60%')
      .setBarBorderRadius(8)
      .setXAxisName('Stock Symbols')
      .setYAxisName('Price in ₹')
      .build();
  }

  /**
   * Real-time update example (simulation)
   */
  static simulateRealTimeUpdates(widget: any): void {
    const builder = StockListChartBuilder.create();
    
    setInterval(() => {
      const updatedData = builder.generateSampleData(10);
      builder.updateData(widget, updatedData);
    }, 5000); // Update every 5 seconds
  }

  /**
   * Export data example
   */
  static exportStockData(): any[] {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(15);
    builder.setData(sampleData);

    const widget = { title: 'Stock Performance Report' };
    return builder.exportData(widget);
  }

  /**
   * Visual map configuration example
   */
  static createVisualMapChart(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(20);

    return builder
      .setData(sampleData)
      .setStockPerformanceConfiguration()
      .setVisualMap({
        type: 'continuous',
        min: -5,
        max: 5,
        text: ['High', 'Low'],
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#ef5350', '#ffffff', '#26a69a']
        }
      })
      .build();
  }

  /**
   * Multiple series example
   */
  static createMultipleSeriesChart(): any {
    const builder = StockListChartBuilder.create();
    const sampleData = builder.generateSampleData(10);

    const chartOptions = builder
      .setData(sampleData)
      .setStockPerformanceConfiguration()
      .build();

    // Add additional series for volume
    chartOptions.yAxis = [
      chartOptions.yAxis,
      {
        type: 'value',
        name: 'Volume',
        position: 'right',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ];

    chartOptions.series.push({
      name: 'Volume',
      type: 'line',
      yAxisIndex: 1,
      data: sampleData.map(item => ({
        name: item.symbol,
        value: item.volume
      })),
      itemStyle: {
        color: '#fac858'
      }
    });

    return chartOptions;
  }
}