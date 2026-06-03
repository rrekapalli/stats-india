import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';

export interface WaterfallChartData {
  name: string;
  value: number;
  isTotal?: boolean;
}

export interface WaterfallChartSeriesOptions {
  name?: string;
  type?: string;
  data?: any[];
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

export interface WaterfallChartOptions {
  xAxis?: any;
  yAxis?: any;
  series?: WaterfallChartSeriesOptions[];
}

/**
 * Waterfall Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Waterfall visualization showing cumulative effects of sequential values
 * - Support for positive and negative contributions
 * - Automatic calculation of cumulative totals
 * - Different colors for positive, negative, and total values
 * - Connecting lines between bars (optional)
 * - Generic data transformation from any[] to waterfall chart format
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with sequential values
 * const widget = WaterfallChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'change' })
 *   .setCategories(['Start', 'Q1', 'Q2', 'Q3', 'Q4', 'End'])
 *   .setHeader('Quarterly Performance Waterfall')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with custom colors and totals
 * const widget = WaterfallChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'step', valueField: 'amount' })
 *   .setPositiveColor('#5cb85c')
 *   .setNegativeColor('#d9534f')
 *   .setTotalColor('#337ab7')
 *   .enableConnectingLines()
 *   .setCurrencyFormatter('USD', 'en-US')
 *   .setFilterColumn('department')
 *   .setHeader('Revenue Waterfall Analysis')
 *   .setPosition({ x: 0, y: 0, cols: 8, rows: 5 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * WaterfallChartBuilder.updateData(widget, newData);
 */
export class WaterfallChartBuilder extends ApacheEchartBuilder<WaterfallChartOptions, WaterfallChartSeriesOptions> {
  private categories: string[] = [];
  private filterColumn: string = '';
  private positiveColor: string = '#5cb85c';
  private negativeColor: string = '#d9534f';
  private totalColor: string = '#337ab7';
  private showConnectingLines: boolean = false;

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new WaterfallChartBuilder instance
   */
  static create(): WaterfallChartBuilder {
    return new WaterfallChartBuilder();
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
        formatter: (params: any) => {
          if (Array.isArray(params) && params.length > 0) {
            const param = params[0];
            const value = param.data.value || param.data;
            const cumulative = param.data.cumulative || value;
            return `${param.name}<br/>Change: ${value}<br/>Cumulative: ${cumulative}`;
          }
          return '';
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
    return 'waterfall';
  }

  /**
   * Get default series options for waterfall chart
   */
  private getDefaultSeriesOptions(): WaterfallChartSeriesOptions {
    return {
      name: 'Waterfall Chart',
      type: 'bar',
      itemStyle: {
        borderRadius: 2,
        color: (params: any) => {
          if (params.data.isTotal) {
            return this.totalColor;
          }
          return params.data.value >= 0 ? this.positiveColor : this.negativeColor;
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
   * Transform generic data array to waterfall chart format
   */
  transformData(options: ChartDataTransformOptions & { startValue?: number } = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      nameField = 'name',
      valueField = 'value',
      startValue = 0,
      aggregateBy,
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      let transformedData = this.data.map(item => ({
        name: item[nameField] || 'Unknown',
        value: parseFloat(item[valueField]) || 0,
        isTotal: item.isTotal || false
      }));

      // Apply aggregation if specified
      if (aggregateBy) {
        const aggregated = new Map<string, { value: number, isTotal: boolean }>();
        transformedData.forEach(item => {
          const key = item.name;
          const existing = aggregated.get(key) || { value: 0, isTotal: item.isTotal };
          aggregated.set(key, {
            value: existing.value + item.value,
            isTotal: item.isTotal || existing.isTotal
          });
        });
        transformedData = Array.from(aggregated.entries()).map(([name, data]) => ({
          name,
          value: data.value,
          isTotal: data.isTotal
        }));
      }

      // Apply sorting (but preserve total items at their positions)
      if (sortBy === 'name') {
        const totals = transformedData.filter(item => item.isTotal);
        const nonTotals = transformedData.filter(item => !item.isTotal);
        nonTotals.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
        transformedData = [...nonTotals, ...totals];
      } else if (sortBy === 'value') {
        const totals = transformedData.filter(item => item.isTotal);
        const nonTotals = transformedData.filter(item => !item.isTotal);
        nonTotals.sort((a, b) => sortOrder === 'asc' ? a.value - b.value : b.value - a.value);
        transformedData = [...nonTotals, ...totals];
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      // Calculate cumulative values and prepare data for waterfall visualization
      let cumulative = startValue;
      const waterfallData: any[] = [];

      transformedData.forEach((item, index) => {
        if (item.isTotal) {
          // For total items, show the full cumulative value
          waterfallData.push({
            value: cumulative,
            itemStyle: {
              color: this.totalColor
            },
            cumulative: cumulative,
            change: item.value,
            isTotal: true
          });
        } else {
          // For regular items, show the change and calculate position
          const previousCumulative = cumulative;
          cumulative += item.value;
          
          if (item.value >= 0) {
            // Positive change: bar starts from previous cumulative
            waterfallData.push({
              value: item.value,
              itemStyle: {
                color: this.positiveColor
              },
              cumulative: cumulative,
              change: item.value,
              base: previousCumulative,
              isTotal: false
            });
          } else {
            // Negative change: bar starts from current cumulative
            waterfallData.push({
              value: Math.abs(item.value),
              itemStyle: {
                color: this.negativeColor
              },
              cumulative: cumulative,
              change: item.value,
              base: cumulative,
              isTotal: false
            });
          }
        }
      });

      this.seriesOptions.data = waterfallData;
      
      // Auto-generate categories if not provided
      if (this.categories.length === 0) {
        this.categories = transformedData.map(item => item.name);
        this.setCategories(this.categories);
      }

    } catch (error) {
      console.error('Error transforming waterfall chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the waterfall chart
   */
  override setData(data: any): this {
    super.setData(data);
    return this;
  }

  /**
   * Set categories for the waterfall chart (X-axis)
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
   * Set color for total values
   */
  setTotalColor(color: string): this {
    this.totalColor = color;
    this.updateColorFunction();
    return this;
  }

  /**
   * Update the color function with current colors
   */
  private updateColorFunction(): void {
    if (this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle.color = (params: any) => {
        if (params.data.isTotal) {
          return this.totalColor;
        }
        return params.data.change >= 0 ? this.positiveColor : this.negativeColor;
      };
    }
  }

  /**
   * Set colors for the waterfall chart (positive, negative, total)
   */
  override setColors(colors: string[]): this {
    if (colors.length >= 3) {
      this.positiveColor = colors[0];
      this.negativeColor = colors[1];
      this.totalColor = colors[2];
      this.updateColorFunction();
    }
    return this;
  }

  /**
   * Enable connecting lines between bars
   */
  enableConnectingLines(): this {
    this.showConnectingLines = true;
    // This would require additional series for lines - simplified for now
    return this;
  }

  /**
   * Disable connecting lines between bars
   */
  disableConnectingLines(): this {
    this.showConnectingLines = false;
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
   * Generate sample data for testing (includes positive, negative, and total values)
   */
  generateSampleData(count: number = 5): this {
    const sampleData = Array.from({ length: count }, (_, i) => {
      if (i === count - 1) {
        // Last item is a total
        return {
          name: `Total`,
          value: 0, // Will be calculated
          isTotal: true
        };
      }
      return {
        name: `Step ${i + 1}`,
        value: Math.floor(Math.random() * 400) - 200, // Range from -200 to 200
        isTotal: false
      };
    });
    
    this.setData(sampleData);
    return this;
  }

  /**
   * Set financial analysis configuration preset
   */
  setFinancialAnalysisConfiguration(): this {
    this.setYAxisName('Amount')
      .setXAxisName('Period')
      .setPositiveColor('#28a745')
      .setNegativeColor('#dc3545')
      .setTotalColor('#007bff')
      .setCurrencyFormatter('USD', 'en-US')
      .enableConnectingLines()
      .setPredefinedPalette('finance');
    return this;
  }

  /**
   * Set performance analysis configuration preset
   */
  setPerformanceAnalysisConfiguration(): this {
    this.setYAxisName('Performance Change')
      .setXAxisName('Metrics')
      .setPositiveColor('#17a2b8')
      .setNegativeColor('#ffc107')
      .setTotalColor('#6f42c1')
      .setPercentageFormatter(1)
      .setPredefinedPalette('business');
    return this;
  }

  /**
   * Set variance analysis configuration preset
   */
  setVarianceAnalysisConfiguration(): this {
    this.setYAxisName('Variance')
      .setXAxisName('Categories')
      .setPositiveColor('#20c997')
      .setNegativeColor('#fd7e14')
      .setTotalColor('#6c757d')
      .setCustomNumberFormatter(0, 'en-US')
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
        let cumulative = 0;
        const waterfallData: any[] = [];

        const transformedData = data.map(item => ({
          name: item.name || item.category || 'Unknown',
          value: parseFloat(item.value || item.amount || item.count) || 0,
          isTotal: item.isTotal || false
        }));

        transformedData.forEach((item, index) => {
          if (item.isTotal) {
            waterfallData.push({
              value: cumulative,
              cumulative: cumulative,
              change: item.value,
              isTotal: true
            });
          } else {
            const previousCumulative = cumulative;
            cumulative += item.value;
            
            waterfallData.push({
              value: Math.abs(item.value),
              cumulative: cumulative,
              change: item.value,
              base: item.value >= 0 ? previousCumulative : cumulative,
              isTotal: false
            });
          }
        });

        if (widget['chartOptions'].series && widget['chartOptions'].series[0]) {
          widget['chartOptions'].series[0].data = waterfallData;
        }

        if (widget['chartOptions'].xAxis) {
          widget['chartOptions'].xAxis.data = transformedData.map(item => item.name);
        }

        // Trigger chart update if chart instance exists
        if (widget.chartInstance && typeof widget.chartInstance.setOption === 'function') {
          widget.chartInstance.setOption(widget['chartOptions'], true);
        }

      } catch (error) {
        console.error(`Error updating waterfall chart data (attempt ${attempt}):`, error);
        if (attempt < 3) {
          setTimeout(() => updateWithRetry(attempt + 1), 100 * attempt);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Check if widget is a waterfall chart
   */
  static isWaterfallChart(widget: IWidget): boolean {
    return widget?.['type'] === 'waterfall' || widget?.['chartType'] === 'waterfall';
  }

  /**
   * Export chart data to various formats
   */
  static override exportData(widget: IWidget): any[] {
    if (!widget?.['chartOptions']?.series?.[0]?.data) {
      return [];
    }

    const data = widget['chartOptions'].series[0].data;
    const categories = widget['chartOptions'].xAxis?.data || [];

    if (Array.isArray(data)) {
      return data.map((item: any, index: number) => {
        return {
          Category: categories[index] || `Category ${index + 1}`,
          Change: item.change || item.value,
          Cumulative: item.cumulative || item.value,
          Type: item.isTotal ? 'Total' : (item.change >= 0 ? 'Positive' : 'Negative')
        };
      });
    }

    return [];
  }

  /**
   * Get export headers for the chart data
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Category', 'Change', 'Cumulative', 'Type'];
  }

  /**
   * Get export sheet name
   */
  static override getExportSheetName(widget: IWidget): string {
    return widget?.['header'] || 'Waterfall Chart Data';
  }
}