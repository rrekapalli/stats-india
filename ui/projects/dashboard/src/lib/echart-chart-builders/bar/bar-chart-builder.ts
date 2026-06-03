import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';

export interface BarChartData {
  name: string;
  value: number;
}

export interface BarChartSeriesOptions {
  name?: string;
  type?: string;
  data?: number[] | BarChartData[];
  barWidth?: string;
  itemStyle?: {
    color?: string | string[];
    borderRadius?: number;
  };
  emphasis?: {
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
}

export interface BarChartOptions {
  xAxis?: any;
  yAxis?: any;
  series?: BarChartSeriesOptions[];
}

/**
 * Enhanced Bar Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to bar chart format
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with generic data transformation
 * const widget = BarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'amount' })
 *   .setCategories(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
 *   .setHeader('Monthly Sales')
 *   .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with presets and formatting
 * const widget = BarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'revenue' })
 *   .setSalesRevenueConfiguration()
 *   .setCurrencyFormatter('USD', 'en-US')
 *   .setPredefinedPalette('finance')
 *   .setFilterColumn('department')
 *   .setHeader('Revenue by Department')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * BarChartBuilder.updateData(widget, newData);
 */
export class BarChartBuilder extends ApacheEchartBuilder<BarChartOptions, BarChartSeriesOptions> {
  private categories: string[] = [];
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new BarChartBuilder instance
   */
  static create(): BarChartBuilder {
    return new BarChartBuilder();
  }

  /**
   * Implement abstract method to get default options
   */
  protected override getDefaultOptions(): any {
    return {
      grid: {
        containLabel: true,
        top: '15%',
        left: '3%',
        right: '4%',
        bottom: '15%',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        show: true,
        orient: 'horizontal',
        top: '10',
      },
      xAxis: {
        type: 'category',
        data: [],
      },
      yAxis: {
        type: 'value',
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'bar';
  }

  /**
   * Get default series options for bar chart
   */
  private getDefaultSeriesOptions(): BarChartSeriesOptions {
    return {
      name: 'Bar Chart',
      type: 'bar',
      itemStyle: {
        borderRadius: 2,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    };
  }

  /**
   * Transform generic data array to bar chart format
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
      sortOrder = 'desc',
      limit
    } = options;

    try {
      let transformedData = this.data.map(item => ({
        name: item[nameField] || 'Unknown',
        value: parseFloat(item[valueField]) || 0
      }));

      // Apply aggregation if specified
      if (aggregateBy) {
        const aggregated = new Map<string, number>();
        transformedData.forEach(item => {
          const key = item.name;
          aggregated.set(key, (aggregated.get(key) || 0) + item.value);
        });
        transformedData = Array.from(aggregated.entries()).map(([name, value]) => ({ name, value }));
      }

      // Apply sorting
      if (sortBy === 'name') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      } else if (sortBy === 'value') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value - b.value : b.value - a.value);
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      this.seriesOptions.data = transformedData;
      
      // Auto-generate categories if not provided
      if (this.categories.length === 0) {
        this.categories = transformedData.map(item => item.name);
        this.setCategories(this.categories);
      }

    } catch (error) {
      console.error('Error transforming bar chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the bar chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data;
    super.setData(data);
    return this;
  }

  /**
   * Set categories for x-axis
   */
  setCategories(categories: string[]): this {
    this.categories = categories;
    (this.chartOptions as any).xAxis = {
      ...(this.chartOptions as any).xAxis,
      data: categories,
    };
    return this;
  }

  /**
   * Set colors for the bars
   */
  override setColors(colors: string[]): this {
    (this.seriesOptions as any).color = colors;
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    return this.setColors(colors);
  }

  /**
   * Set bar width
   */
  setBarWidth(width: string): this {
    this.seriesOptions.barWidth = width;
    return this;
  }

  /**
   * Set bar border radius
   */
  setBarBorderRadius(radius: number): this {
    this.seriesOptions.itemStyle = {
      ...this.seriesOptions.itemStyle,
      borderRadius: radius,
    };
    return this;
  }

  /**
   * Set y-axis name
   */
  setYAxisName(name: string): this {
    (this.chartOptions as any).yAxis = {
      ...(this.chartOptions as any).yAxis,
      name,
      nameLocation: 'middle',
      nameGap: 30,
    };
    return this;
  }

  /**
   * Set x-axis name
   */
  setXAxisName(name: string): this {
    (this.chartOptions as any).xAxis = {
      ...(this.chartOptions as any).xAxis,
      name,
      nameLocation: 'middle',
      nameGap: 30,
    };
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
  generateSampleData(count: number = 5): this {
    const sampleData = [];
    const categories = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
    
    for (let i = 0; i < Math.min(count, categories.length); i++) {
      sampleData.push({
        name: categories[i],
        value: Math.floor(Math.random() * 100) + 10,
        category: categories[i],
        department: ['Sales', 'Marketing', 'Operations'][Math.floor(Math.random() * 3)]
      });
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for sales revenue
   */
  setSalesRevenueConfiguration(): this {
    return this
      .setBarWidth('60%')
      .setBarBorderRadius(4)
      .setYAxisName('Revenue ($)')
      .setXAxisName('Time Period')
      .setPredefinedPalette('finance')
      .setTooltip('axis', '{b}: ${c}');
  }

  /**
   * Configuration preset for performance metrics
   */
  setPerformanceConfiguration(): this {
    return this
      .setBarWidth('70%')
      .setBarBorderRadius(6)
      .setYAxisName('Performance Score')
      .setXAxisName('Metrics')
      .setPredefinedPalette('business')
      .setTooltip('axis', '{b}: {c}%');
  }

  /**
   * Configuration preset for comparison analysis
   */
  setComparisonConfiguration(): this {
    return this
      .setBarWidth('50%')
      .setBarBorderRadius(2)
      .setYAxisName('Value')
      .setXAxisName('Categories')
      .setPredefinedPalette('modern')
      .setTooltip('axis', '{b}: {c}');
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    const finalOptions: BarChartOptions = {
      ...this.chartOptions,
      series: [{
        ...this.seriesOptions,
        type: 'bar',
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
            transformedData = data.map(item => ({
              name: item.name || item.category || 'Unknown',
              value: parseFloat(item.value) || 0
            }));
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
        console.error('Error updating bar chart data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Static method to check if a widget is a bar chart
   */
  static isBarChart(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'bar');
  }

  /**
   * Export bar chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const exportData: any[] = [];
    
    if (widget['echart_options']?.series?.[0]?.data && widget['echart_options']?.xAxis?.data) {
      const seriesData = widget['echart_options'].series[0].data;
      const categories = widget['echart_options'].xAxis.data;
      
      for (let i = 0; i < seriesData.length; i++) {
        const item = seriesData[i];
        const category = categories[i] || `Category ${i + 1}`;
        
        if (typeof item === 'object' && item !== null) {
          exportData.push({
            Category: item.name || category,
            Value: item.value || 0,
            ...item
          });
        } else {
          exportData.push({
            Category: category,
            Value: item || 0
          });
        }
      }
    }
    
    return exportData;
  }

  /**
   * Get export headers for Excel/CSV export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Category', 'Value'];
  }

  /**
   * Get export sheet name for Excel export
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Bar Chart Data';
  }
} 