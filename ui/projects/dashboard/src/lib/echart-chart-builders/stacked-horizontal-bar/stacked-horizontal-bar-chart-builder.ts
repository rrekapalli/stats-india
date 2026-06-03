import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';

export interface StackedHorizontalBarChartData {
  name: string;
  value: number;
  stack?: string;
}

export interface StackedHorizontalBarChartSeriesOptions {
  name?: string;
  type?: string;
  stack?: string;
  data?: number[] | StackedHorizontalBarChartData[];
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

export interface StackedHorizontalBarChartOptions {
  xAxis?: any;
  yAxis?: any;
  series?: StackedHorizontalBarChartSeriesOptions[];
}

/**
 * Stacked Horizontal Bar Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Horizontal orientation with stacked bars
 * - Multiple data series support with stack grouping
 * - Categories on Y-axis and values on X-axis
 * - Generic data transformation from any[] to stacked horizontal bar chart format
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with multiple series
 * const widget = StackedHorizontalBarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'amount', stackField: 'type' })
 *   .setCategories(['Q1', 'Q2', 'Q3', 'Q4'])
 *   .setHeader('Quarterly Sales by Product')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with presets and formatting
 * const widget = StackedHorizontalBarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'quarter', valueField: 'revenue', stackField: 'product' })
 *   .setSalesRevenueConfiguration()
 *   .setCurrencyFormatter('USD', 'en-US')
 *   .setPredefinedPalette('finance')
 *   .setFilterColumn('department')
 *   .setHeader('Revenue by Quarter and Product')
 *   .setPosition({ x: 0, y: 0, cols: 8, rows: 5 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * StackedHorizontalBarChartBuilder.updateData(widget, newData);
 */
export class StackedHorizontalBarChartBuilder extends ApacheEchartBuilder<StackedHorizontalBarChartOptions, StackedHorizontalBarChartSeriesOptions> {
  private categories: string[] = [];
  private filterColumn: string = '';
  private stackGroups: Map<string, StackedHorizontalBarChartSeriesOptions> = new Map();

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new StackedHorizontalBarChartBuilder instance
   */
  static create(): StackedHorizontalBarChartBuilder {
    return new StackedHorizontalBarChartBuilder();
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
        type: 'value',
      },
      yAxis: {
        type: 'category',
        data: [],
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'stacked-horizontal-bar';
  }

  /**
   * Get default series options for stacked horizontal bar chart
   */
  private getDefaultSeriesOptions(): StackedHorizontalBarChartSeriesOptions {
    return {
      name: 'Stacked Horizontal Bar Chart',
      type: 'bar',
      stack: 'total',
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
   * Transform generic data array to stacked horizontal bar chart format
   */
  transformData(options: ChartDataTransformOptions & { stackField?: string } = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      nameField = 'name',
      valueField = 'value',
      stackField = 'stack',
      aggregateBy,
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      // Group data by stack field
      const stackGroups = new Map<string, Map<string, number>>();
      const categories = new Set<string>();

      this.data.forEach(item => {
        const category = item[nameField] || 'Unknown';
        const value = parseFloat(item[valueField]) || 0;
        const stack = item[stackField] || 'default';

        categories.add(category);

        if (!stackGroups.has(stack)) {
          stackGroups.set(stack, new Map());
        }

        const stackData = stackGroups.get(stack)!;
        stackData.set(category, (stackData.get(category) || 0) + value);
      });

      // Convert to series format
      const categoriesArray = Array.from(categories);
      this.categories = categoriesArray;
      this.setCategories(categoriesArray);

      // Clear existing stack groups
      this.stackGroups.clear();

      // Create series for each stack
      stackGroups.forEach((stackData, stackName) => {
        const seriesData = categoriesArray.map(category => stackData.get(category) || 0);
        
        const seriesOptions: StackedHorizontalBarChartSeriesOptions = {
          name: stackName,
          type: 'bar',
          stack: 'total',
          data: seriesData,
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

        this.stackGroups.set(stackName, seriesOptions);
      });

      // Apply sorting if specified
      if (sortBy === 'name') {
        this.categories.sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
      } else if (sortBy === 'value') {
        // Sort by total value across all stacks
        const totalValues = this.categories.map(category => {
          let total = 0;
          this.stackGroups.forEach(series => {
            const index = categoriesArray.indexOf(category);
            if (index >= 0 && Array.isArray(series.data)) {
              total += (series.data[index] as number) || 0;
            }
          });
          return { category, total };
        });

        totalValues.sort((a, b) => sortOrder === 'asc' ? a.total - b.total : b.total - a.total);
        this.categories = totalValues.map(item => item.category);
      }

      // Apply limit
      if (limit && limit > 0) {
        this.categories = this.categories.slice(0, limit);
      }

      // Update categories and reorder series data
      this.setCategories(this.categories);
      this.stackGroups.forEach(series => {
        if (Array.isArray(series.data)) {
          const reorderedData = this.categories.map(category => {
            const originalIndex = categoriesArray.indexOf(category);
            return originalIndex >= 0 ? (series.data as number[])[originalIndex] : 0;
          });
          series.data = reorderedData;
        }
      });

    } catch (error) {
      console.error('Error transforming stacked horizontal bar chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the stacked horizontal bar chart
   */
  override setData(data: any): this {
    super.setData(data);
    return this;
  }

  /**
   * Set categories for the stacked horizontal bar chart (Y-axis)
   */
  setCategories(categories: string[]): this {
    this.categories = categories;
    if (this.chartOptions.yAxis) {
      this.chartOptions.yAxis.data = categories;
    }
    return this;
  }

  /**
   * Add a series to the stacked horizontal bar chart
   */
  override addSeries(series: any): this {
    return super.addSeries(series);
  }

  /**
   * Add a series to the stacked horizontal bar chart with name, data and stack
   */
  addStackedSeries(name: string, data: number[], stack: string = 'total'): this {
    const seriesOptions: StackedHorizontalBarChartSeriesOptions = {
      name,
      type: 'bar',
      stack,
      data,
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

    this.stackGroups.set(name, seriesOptions);
    return this;
  }

  /**
   * Set colors for the stacked horizontal bar chart
   */
  override setColors(colors: string[]): this {
    let colorIndex = 0;
    this.stackGroups.forEach(series => {
      if (series.itemStyle && colorIndex < colors.length) {
        series.itemStyle.color = colors[colorIndex];
        colorIndex++;
      }
    });
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
    this.stackGroups.forEach(series => {
      series.barWidth = width;
    });
    return this;
  }

  /**
   * Set bar border radius
   */
  setBarBorderRadius(radius: number): this {
    this.stackGroups.forEach(series => {
      if (!series.itemStyle) {
        series.itemStyle = {};
      }
      series.itemStyle.borderRadius = radius;
    });
    return this;
  }

  /**
   * Set X-axis name (value axis for horizontal bars)
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
   * Set Y-axis name (category axis for horizontal bars)
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
   * Generate sample data for testing
   */
  generateSampleData(count: number = 5): this {
    const categories = Array.from({ length: count }, (_, i) => `Category ${i + 1}`);
    const stacks = ['Product A', 'Product B', 'Product C'];
    
    const sampleData: any[] = [];
    categories.forEach(category => {
      stacks.forEach(stack => {
        sampleData.push({
          name: category,
          value: Math.floor(Math.random() * 500) + 50,
          stack: stack
        });
      });
    });
    
    this.setData(sampleData);
    return this;
  }

  /**
   * Set sales revenue configuration preset
   */
  setSalesRevenueConfiguration(): this {
    this.setXAxisName('Revenue')
      .setYAxisName('Time Period')
      .setCurrencyFormatter('USD', 'en-US')
      .setPredefinedPalette('finance');
    return this;
  }

  /**
   * Set performance configuration preset
   */
  setPerformanceConfiguration(): this {
    this.setXAxisName('Performance Score')
      .setYAxisName('Metrics')
      .setPercentageFormatter(1)
      .setPredefinedPalette('business');
    return this;
  }

  /**
   * Set comparison configuration preset
   */
  setComparisonConfiguration(): this {
    this.setXAxisName('Value')
      .setYAxisName('Categories')
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
    this.chartOptions.series = Array.from(this.stackGroups.values());

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
        // Group data by stack field
        const stackGroups = new Map<string, Map<string, number>>();
        const categories = new Set<string>();

        data.forEach(item => {
          const category = item.name || item.category || 'Unknown';
          const value = parseFloat(item.value || item.amount || item.count) || 0;
          const stack = item.stack || item.type || 'default';

          categories.add(category);

          if (!stackGroups.has(stack)) {
            stackGroups.set(stack, new Map());
          }

          const stackData = stackGroups.get(stack)!;
          stackData.set(category, (stackData.get(category) || 0) + value);
        });

        const categoriesArray = Array.from(categories);

        // Update yAxis categories
        if (widget['chartOptions'].yAxis) {
          widget['chartOptions'].yAxis.data = categoriesArray;
        }

        // Update series data
        const seriesArray: any[] = [];
        stackGroups.forEach((stackData, stackName) => {
          const seriesData = categoriesArray.map(category => stackData.get(category) || 0);
          
          seriesArray.push({
            name: stackName,
            type: 'bar',
            stack: 'total',
            data: seriesData
          });
        });

        widget['chartOptions'].series = seriesArray;

        // Trigger chart update if chart instance exists
        if (widget.chartInstance && typeof widget.chartInstance.setOption === 'function') {
          widget.chartInstance.setOption(widget['chartOptions'], true);
        }

      } catch (error) {
        console.error(`Error updating stacked horizontal bar chart data (attempt ${attempt}):`, error);
        if (attempt < 3) {
          setTimeout(() => updateWithRetry(attempt + 1), 100 * attempt);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Check if widget is a stacked horizontal bar chart
   */
  static isStackedHorizontalBarChart(widget: IWidget): boolean {
    return widget?.['type'] === 'stacked-horizontal-bar' || widget?.['chartType'] === 'stacked-horizontal-bar';
  }

  /**
   * Export chart data to various formats
   */
  static override exportData(widget: IWidget): any[] {
    if (!widget?.['chartOptions']?.series) {
      return [];
    }

    const exportData: any[] = [];
    const categories = widget['chartOptions'].yAxis?.data || [];

    widget['chartOptions'].series.forEach((series: any) => {
      if (Array.isArray(series.data)) {
        series.data.forEach((value: number, index: number) => {
          exportData.push({
            Category: categories[index] || `Category ${index + 1}`,
            Series: series.name || 'Unknown',
            Value: value
          });
        });
      }
    });

    return exportData;
  }

  /**
   * Get export headers for the chart data
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Category', 'Series', 'Value'];
  }

  /**
   * Get export sheet name
   */
  static override getExportSheetName(widget: IWidget): string {
    return widget?.['header'] || 'Stacked Horizontal Bar Chart Data';
  }
}