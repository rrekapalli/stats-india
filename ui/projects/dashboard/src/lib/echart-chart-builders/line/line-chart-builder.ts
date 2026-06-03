import { IWidget, WidgetBuilder } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';

export interface LineChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface LineChartSeriesOptions {
  name?: string;
  type?: string;
  data?: LineChartData[] | number[];
  smooth?: boolean;
  symbol?: string;
  symbolSize?: number;
  lineStyle?: {
    width?: number;
    color?: string;
    type?: string;
  };
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  areaStyle?: {
    color?: string;
    opacity?: number;
  };
  showSymbol?: boolean;
  emphasis?: {
    focus?: string;
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
}

export interface LineChartOptions {
  xAxis?: {
    type?: string;
    data?: string[];
    name?: string;
    nameLocation?: string;
    axisLabel?: {
      rotate?: number;
      color?: string;
    };
  };
  yAxis?: {
    type?: string;
    name?: string;
    nameLocation?: string;
    axisLabel?: {
      color?: string;
    };
  };
  series?: LineChartSeriesOptions[];
}

/**
 * Enhanced Line Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to line chart format
 * - Time series and trend analysis capabilities
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with generic data transformation
 * const widget = LineChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'date', valueField: 'price' })
 *   .setXAxisData(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
 *   .setHeader('Stock Price Trend')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with trend analysis
 * const widget = LineChartBuilder.create()
 *   .setData(timeSeriesData)
 *   .transformData({ nameField: 'timestamp', valueField: 'value' })
 *   .setTrendAnalysisConfiguration()
 *   .setCurrencyFormatter('USD', 'en-US')
 *   .setPredefinedPalette('finance')
 *   .setFilterColumn('category')
 *   .setHeader('Revenue Trend Analysis')
 *   .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * LineChartBuilder.updateData(widget, newData);
 */
export class LineChartBuilder extends ApacheEchartBuilder<LineChartOptions, LineChartSeriesOptions> {
  private xAxisData: string[] = [];
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new LineChartBuilder instance
   */
  static create(): LineChartBuilder {
    return new LineChartBuilder();
  }

  /**
   * Implement abstract method to get default options
   */
  protected override getDefaultOptions(): any {
    return {
      grid: {
        containLabel: true,
        top: '15%',
        left: '10%',
        right: '10%',
        bottom: '15%',
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}',
      },
      legend: {
        show: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '10',
      },
      xAxis: {
        type: 'category',
        data: [],
        nameLocation: 'middle',
        axisLabel: {
          rotate: 0,
          color: '#666',
        },
      },
      yAxis: {
        type: 'value',
        nameLocation: 'middle',
        axisLabel: {
          color: '#666',
        },
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'line';
  }

  /**
   * Get default series options for line chart
   */
  private getDefaultSeriesOptions(): LineChartSeriesOptions {
    return {
      name: 'Line Chart',
      type: 'line',
      smooth: false,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: true,
      lineStyle: {
        width: 2,
        color: '#5470c6',
        type: 'solid',
      },
      itemStyle: {
        color: '#5470c6',
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    };
  }

  /**
   * Transform generic data array to line chart format
   */
  transformData(options: ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      nameField = 'name',
      valueField = 'value',
      aggregateBy,
      sortBy,
      sortOrder = 'asc',
      limit,
      dateFormat
    } = options;

    try {
      let transformedData = this.data.map(item => ({
        name: item[nameField] || 'Unknown',
        value: parseFloat(item[valueField]) || 0,
        originalItem: item
      }));

      // Apply aggregation if specified
      if (aggregateBy) {
        const aggregated = new Map<string, number>();
        transformedData.forEach(item => {
          const key = item.name;
          aggregated.set(key, (aggregated.get(key) || 0) + item.value);
        });
        transformedData = Array.from(aggregated.entries()).map(([name, value]) => ({ name, value, originalItem: null }));
      }

      // Apply sorting (important for time series)
      if (sortBy === 'name') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      } else if (sortBy === 'value') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value - b.value : b.value - a.value);
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      // Extract values for series data
      this.seriesOptions.data = transformedData.map(item => item.value);
      
      // Auto-generate x-axis data if not provided
      if (this.xAxisData.length === 0) {
        this.xAxisData = transformedData.map(item => item.name);
        this.setXAxisData(this.xAxisData);
      }

    } catch (error) {
      console.error('Error transforming line chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the line chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data;
    super.setData(data);
    return this;
  }

  /**
   * Set X-axis data (categories)
   */
  setXAxisData(data: string[]): this {
    this.xAxisData = data;
    (this.chartOptions as any).xAxis = {
      ...(this.chartOptions as any).xAxis,
      data: data,
    };
    return this;
  }

  /**
   * Set X-axis name
   */
  setXAxisName(name: string): this {
    (this.chartOptions as any).xAxis = {
      ...(this.chartOptions as any).xAxis,
      name,
    };
    return this;
  }

  /**
   * Set Y-axis name
   */
  setYAxisName(name: string): this {
    (this.chartOptions as any).yAxis = {
      ...(this.chartOptions as any).yAxis,
      name,
    };
    return this;
  }

  /**
   * Set smooth curve
   */
  setSmooth(smooth: boolean): this {
    this.seriesOptions.smooth = smooth;
    return this;
  }

  /**
   * Set symbol type and size
   */
  setSymbol(symbol: string, size: number = 6): this {
    this.seriesOptions.symbol = symbol;
    this.seriesOptions.symbolSize = size;
    return this;
  }

  /**
   * Set line style
   */
  setLineStyle(width: number, color: string, type: string = 'solid'): this {
    this.seriesOptions.lineStyle = {
      width,
      color,
      type,
    };
    return this;
  }

  /**
   * Set area style for area chart effect
   */
  setAreaStyle(color: string, opacity: number = 0.3): this {
    this.seriesOptions.areaStyle = {
      color,
      opacity,
    };
    return this;
  }

  /**
   * Set show symbol
   */
  setShowSymbol(show: boolean): this {
    this.seriesOptions.showSymbol = show;
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length > 0) {
      this.setLineStyle(2, colors[0]);
      this.seriesOptions.itemStyle = {
        ...this.seriesOptions.itemStyle,
        color: colors[0]
      };
    }
    return this;
  }

  /**
   * Set currency formatter for values
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setValueFormatter(formatter);
    return this;
  }

  /**
   * Set percentage formatter for values
   */
  override setPercentageFormatter(decimals: number = 1): this {
    const formatter = this.createPercentageFormatter(decimals);
    this.setValueFormatter(formatter);
    return this;
  }

  /**
   * Set number formatter for values with custom options
   */
  setCustomNumberFormatter(decimals: number = 0, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setValueFormatter(formatter);
    return this;
  }

  /**
   * Set filter column for filtering integration
   */
  override setFilterColumn(column: string): this {
    this.filterColumn = column;
    return this;
  }

  /**
   * Create filter from chart data
   */
  createFilterFromChartData(): DataFilter[] {
    if (!this.filterColumn || !this.data) return [];

    const uniqueValues = [...new Set(this.data.map(item => item[this.filterColumn]))];
    return [{
      column: this.filterColumn,
      operator: 'in',
      value: uniqueValues
    }];
  }

  /**
   * Generate sample data for testing
   */
  generateSampleData(count: number = 12): this {
    const sampleData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let baseValue = 100;
    for (let i = 0; i < Math.min(count, months.length); i++) {
      const variation = (Math.random() - 0.5) * 20;
      baseValue += variation;
      sampleData.push({
        name: months[i],
        value: Math.round(baseValue),
        date: months[i],
        category: ['Revenue', 'Profit', 'Expenses'][Math.floor(Math.random() * 3)]
      });
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for trend analysis
   */
  setTrendAnalysisConfiguration(): this {
    return this
      .setSmooth(true)
      .setSymbol('circle', 4)
      .setLineStyle(3, '#5470c6')
      .setAreaStyle('#5470c6', 0.1)
      .setYAxisName('Value')
      .setXAxisName('Time Period')
      .setPredefinedPalette('finance')
      .setTooltip('axis', '{b}: {c}');
  }

  /**
   * Configuration preset for performance monitoring
   */
  setPerformanceConfiguration(): this {
    return this
      .setSmooth(false)
      .setSymbol('diamond', 6)
      .setLineStyle(2, '#91cc75')
      .setYAxisName('Performance Score')
      .setXAxisName('Metrics')
      .setPredefinedPalette('business')
      .setTooltip('axis', '{b}: {c}%');
  }

  /**
   * Configuration preset for time series
   */
  setTimeSeriesConfiguration(): this {
    return this
      .setSmooth(true)
      .setSymbol('none', 0)
      .setLineStyle(2, '#fac858')
      .setShowSymbol(false)
      .setYAxisName('Value')
      .setXAxisName('Time')
      .setPredefinedPalette('modern')
      .setTooltip('axis', '{b}: {c}');
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    const finalOptions: LineChartOptions = {
      ...this.chartOptions,
      series: [{
        ...this.seriesOptions,
        type: 'line',
      }],
    };

    return this.widgetBuilder
      .setEChartsOptions(finalOptions)
      .build();
  }

  /**
   * Enhanced updateData with retry mechanism
   */
  static override updateData(widget: IWidget, data: any): void {
    const maxRetries = 3;
    let retryCount = 0;

    const updateWithRetry = () => {
      try {
        if (widget.chartInstance) {
          // Transform data if needed
          let transformedData = data;
          if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            transformedData = data.map(item => parseFloat(item.value) || 0);
          }

                     const currentOptions = widget.chartInstance.getOption();
           const newOptions = {
             ...currentOptions,
             series: [{
               ...(currentOptions as any)['series'][0],
               data: transformedData
             }]
           };

          widget.chartInstance.setOption(newOptions, true);
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      } catch (error) {
        console.error('Error updating line chart data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Static method to check if a widget is a line chart
   */
  static isLineChart(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'line');
  }

  /**
   * Static method to create line chart widget
   */
  static createLineChartWidget(data?: LineChartData[] | number[], xAxisData?: string[]): WidgetBuilder {
    const builder = LineChartBuilder.create();
    
    if (data) {
      builder.setData(data);
    }
    
    if (xAxisData) {
      builder.setXAxisData(xAxisData);
    }
    
    return builder.getWidgetBuilder();
  }

  /**
   * Export line chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const exportData: any[] = [];
    
    if (widget['echart_options']?.series?.[0]?.data && widget['echart_options']?.xAxis?.data) {
      const seriesData = widget['echart_options'].series[0].data;
      const xAxisData = widget['echart_options'].xAxis.data;
      
      for (let i = 0; i < seriesData.length; i++) {
        const value = seriesData[i];
        const label = xAxisData[i] || `Point ${i + 1}`;
        
        exportData.push({
          Label: label,
          Value: value || 0
        });
      }
    }
    
    return exportData;
  }

  /**
   * Get export headers for Excel/CSV export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Label', 'Value'];
  }

  /**
   * Get export sheet name for Excel export
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Line Chart Data';
  }
}

// Legacy function for backward compatibility
export function createLineChartWidget(data?: LineChartData[] | number[], xAxisData?: string[]): WidgetBuilder {
  return LineChartBuilder.createLineChartWidget(data, xAxisData);
} 