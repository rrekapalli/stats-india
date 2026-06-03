import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';

export interface NegativeBarChartData {
  name: string;
  value: number;
}

export interface NegativeBarChartSeriesOptions {
  name?: string;
  type?: string;
  data?: number[] | NegativeBarChartData[];
  barWidth?: string;
  itemStyle?: {
    color?: string | string[] | ((params: any) => string);
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

export interface NegativeBarChartOptions {
  xAxis?: any;
  yAxis?: any;
  series?: NegativeBarChartSeriesOptions[];
}

/**
 * Negative Bar Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Support for positive and negative values with different colors
 * - Automatic color assignment based on value sign
 * - Zero baseline reference line
 * - Generic data transformation from any[] to negative bar chart format
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with positive and negative values
 * const widget = NegativeBarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'profit' })
 *   .setCategories(['Q1', 'Q2', 'Q3', 'Q4'])
 *   .setHeader('Quarterly Profit/Loss')
 *   .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with custom colors for positive/negative
 * const widget = NegativeBarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'month', valueField: 'change' })
 *   .setPositiveColor('#5cb85c')
 *   .setNegativeColor('#d9534f')
 *   .setCurrencyFormatter('USD', 'en-US')
 *   .setFilterColumn('department')
 *   .setHeader('Monthly Change Analysis')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * NegativeBarChartBuilder.updateData(widget, newData);
 */
export class NegativeBarChartBuilder extends ApacheEchartBuilder<NegativeBarChartOptions, NegativeBarChartSeriesOptions> {
  private categories: string[] = [];
  private filterColumn: string = '';
  private positiveColor: string = '#5cb85c';
  private negativeColor: string = '#d9534f';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new NegativeBarChartBuilder instance
   */
  static create(): NegativeBarChartBuilder {
    return new NegativeBarChartBuilder();
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
        axisLine: {
          show: true,
        },
        axisTick: {
          show: true,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: true,
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed',
          },
        },
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'negative-bar';
  }

  /**
   * Get default series options for negative bar chart
   */
  private getDefaultSeriesOptions(): NegativeBarChartSeriesOptions {
    return {
      name: 'Negative Bar Chart',
      type: 'bar',
      itemStyle: {
        borderRadius: 2,
        color: (params: any) => {
          return params.value >= 0 ? this.positiveColor : this.negativeColor;
        },
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
   * Transform generic data array to negative bar chart format
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
      console.error('Error transforming negative bar chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the negative bar chart
   */
  override setData(data: any): this {
    super.setData(data);
    return this;
  }

  /**
   * Set categories for the negative bar chart (X-axis)
   */
  setCategories(categories: string[]): this {
    this.categories = categories;
    if (this.chartOptions.xAxis) {
      this.chartOptions.xAxis.data = categories;
    }
    return this;
  }

  /**
   * Set color for positive values
   */
  setPositiveColor(color: string): this {
    this.positiveColor = color;
    this.updateColorFunction();
    return this;
  }

  /**
   * Set color for negative values
   */
  setNegativeColor(color: string): this {
    this.negativeColor = color;
    this.updateColorFunction();
    return this;
  }

  /**
   * Update the color function with current positive/negative colors
   */
  private updateColorFunction(): void {
    if (this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle.color = (params: any) => {
        return params.value >= 0 ? this.positiveColor : this.negativeColor;
      };
    }
  }

  /**
   * Set colors for the negative bar chart (will be used for positive/negative)
   */
  override setColors(colors: string[]): this {
    if (colors.length >= 2) {
      this.positiveColor = colors[0];
      this.negativeColor = colors[1];
      this.updateColorFunction();
    }
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    super.setPredefinedPalette(palette);
    return this;
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
    if (!this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle = {};
    }
    this.seriesOptions.itemStyle.borderRadius = radius;
    return this;
  }

  /**
   * Set Y-axis name (value axis)
   */
  setYAxisName(name: string): this {
    if (!this.chartOptions.yAxis) {
      this.chartOptions.yAxis = {};
    }
    this.chartOptions.yAxis.name = name;
    this.chartOptions.yAxis.nameLocation = 'middle';
    this.chartOptions.yAxis.nameGap = 50;
    return this;
  }

  /**
   * Set X-axis name (category axis)
   */
  setXAxisName(name: string): this {
    if (!this.chartOptions.xAxis) {
      this.chartOptions.xAxis = {};
    }
    this.chartOptions.xAxis.name = name;
    this.chartOptions.xAxis.nameLocation = 'middle';
    this.chartOptions.xAxis.nameGap = 30;
    return this;
  }

  /**
   * Enable zero baseline reference line
   */
  enableZeroBaseline(): this {
    if (!this.chartOptions.yAxis) {
      this.chartOptions.yAxis = {};
    }
    
    this.chartOptions.yAxis.splitLine = {
      show: true,
      lineStyle: {
        color: (value: number) => value === 0 ? '#000' : '#e0e0e0',
        width: (value: number) => value === 0 ? 2 : 1,
        type: 'solid',
      },
    };
    
    return this;
  }

  /**
   * Set currency formatter
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    super.setCurrencyFormatter(currency, locale);
    return this;
  }

  /**
   * Set percentage formatter
   */
  override setPercentageFormatter(decimals: number = 1): this {
    super.setPercentageFormatter(decimals);
    return this;
  }

  /**
   * Set custom number formatter
   */
  setCustomNumberFormatter(decimals: number = 0, locale: string = 'en-US'): this {
    super.setNumberFormatter(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return this;
  }

  /**
   * Set filter column for data filtering
   */
  override setFilterColumn(column: string): this {
    this.filterColumn = column;
    return this;
  }

  /**
   * Create filter from chart data
   */
  createFilterFromChartData(): DataFilter | null {
    if (!this.filterColumn || !this.data) {
      return null;
    }

    const uniqueValues = [...new Set(this.data.map(item => item[this.filterColumn]))];
    return {
      column: this.filterColumn,
      operator: 'in' as const,
      value: uniqueValues
    };
  }

  /**
   * Generate sample data for testing (includes positive and negative values)
   */
  generateSampleData(count: number = 5): this {
    const sampleData = Array.from({ length: count }, (_, i) => ({
      name: `Category ${i + 1}`,
      value: Math.floor(Math.random() * 2000) - 1000 // Range from -1000 to 1000
    }));
    
    this.setData(sampleData);
    return this;
  }

  /**
   * Set profit/loss configuration preset
   */
  setProfitLossConfiguration(): this {
    this.setYAxisName('Profit/Loss')
      .setXAxisName('Period')
      .setPositiveColor('#5cb85c')
      .setNegativeColor('#d9534f')
      .setCurrencyFormatter('USD', 'en-US')
      .enableZeroBaseline()
      .setPredefinedPalette('finance');
    return this;
  }

  /**
   * Set variance configuration preset
   */
  setVarianceConfiguration(): this {
    this.setYAxisName('Variance')
      .setXAxisName('Metrics')
      .setPositiveColor('#337ab7')
      .setNegativeColor('#f0ad4e')
      .setPercentageFormatter(1)
      .enableZeroBaseline()
      .setPredefinedPalette('business');
    return this;
  }

  /**
   * Set change analysis configuration preset
   */
  setChangeAnalysisConfiguration(): this {
    this.setYAxisName('Change')
      .setXAxisName('Categories')
      .setPositiveColor('#28a745')
      .setNegativeColor('#dc3545')
      .setNumberFormatter('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .enableZeroBaseline()
      .setPredefinedPalette('modern');
    return this;
  }

  /**
   * Build the widget with all configurations
   */
  override build(): IWidget {
    // Ensure series is properly set
    if (!this.chartOptions.series) {
      this.chartOptions.series = [];
    }
    this.chartOptions.series = [this.seriesOptions];

    return super.build();
  }

  /**
   * Update widget data with enhanced transformation and retry mechanism
   */
  static override updateData(widget: IWidget, data: any[]): void {
    if (!widget || !widget['chartOptions']) {
      return;
    }

    const updateWithRetry = (attempt: number = 1) => {
      try {
        const transformedData = data.map(item => ({
          name: item.name || item.category || 'Unknown',
          value: parseFloat(item.value || item.amount || item.count) || 0
        }));

        if (widget['chartOptions'].series && widget['chartOptions'].series[0]) {
          widget['chartOptions'].series[0].data = transformedData;
        }

        if (widget['chartOptions'].xAxis) {
          widget['chartOptions'].xAxis.data = transformedData.map(item => item.name);
        }

        // Trigger chart update if chart instance exists
        if (widget.chartInstance && typeof widget.chartInstance.setOption === 'function') {
          widget.chartInstance.setOption(widget['chartOptions'], true);
        }

      } catch (error) {
        console.error(`Error updating negative bar chart data (attempt ${attempt}):`, error);
        if (attempt < 3) {
          setTimeout(() => updateWithRetry(attempt + 1), 100 * attempt);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Check if widget is a negative bar chart
   */
  static isNegativeBarChart(widget: IWidget): boolean {
    return widget?.['type'] === 'negative-bar' || widget?.['chartType'] === 'negative-bar';
  }

  /**
   * Export chart data to various formats
   */
  static override exportData(widget: IWidget): any[] {
    if (!widget?.['chartOptions']?.series?.[0]?.data) {
      return [];
    }

    const data = widget['chartOptions'].series[0].data;
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (typeof item === 'object' && item.name && item.value !== undefined) {
          return {
            Category: item.name,
            Value: item.value,
            Type: item.value >= 0 ? 'Positive' : 'Negative'
          };
        }
        return { 
          Value: item,
          Type: item >= 0 ? 'Positive' : 'Negative'
        };
      });
    }

    return [];
  }

  /**
   * Get export headers for the chart data
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Category', 'Value', 'Type'];
  }

  /**
   * Get export sheet name
   */
  static override getExportSheetName(widget: IWidget): string {
    return widget?.['header'] || 'Negative Bar Chart Data';
  }
}