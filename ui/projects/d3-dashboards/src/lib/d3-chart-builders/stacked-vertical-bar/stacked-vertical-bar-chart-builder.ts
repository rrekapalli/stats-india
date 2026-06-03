import { IWidget } from '../../../public-api';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../d3-chart-builder';

export interface StackedVerticalBarChartData {
  name: string;
  value: number;
  stack?: string;
}

export interface StackedVerticalBarChartSeriesOptions {
  name?: string;
  type?: string;
  stack?: string;
  data?: number[] | StackedVerticalBarChartData[];
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

export interface StackedVerticalBarChartOptions {
  xAxis?: any;
  yAxis?: any;
  series?: StackedVerticalBarChartSeriesOptions[];
}

/**
 * Stacked Vertical Bar Chart Builder extending the generic D3ChartBuilder
 * 
 * Features:
 * - Vertical orientation with stacked bars
 * - Multiple data series support with stack grouping
 * - Categories on X-axis and values on Y-axis
 * - Support for stack normalization (percentage mode)
 * - Generic data transformation from any[] to stacked vertical bar chart format
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with multiple series
 * const widget = StackedVerticalD3BarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'amount', stackField: 'type' })
 *   .setCategories(['Q1', 'Q2', 'Q3', 'Q4'])
 *   .setHeader('Quarterly Sales by Product')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with normalization (percentage mode)
 * const widget = StackedVerticalD3BarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'quarter', valueField: 'revenue', stackField: 'product' })
 *   .enableNormalization()
 *   .setSalesRevenueConfiguration()
 *   .setPercentageFormatter(1)
 *   .setPredefinedPalette('finance')
 *   .setFilterColumn('department')
 *   .setHeader('Revenue Distribution by Quarter and Product')
 *   .setPosition({ x: 0, y: 0, cols: 8, rows: 5 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * StackedVerticalD3BarChartBuilder.updateData(widget, newData);
 */
export class StackedVerticalD3BarChartBuilder extends D3ChartBuilder<StackedVerticalBarChartOptions, StackedVerticalBarChartSeriesOptions> {
  private categories: string[] = [];
  private filterColumn: string = '';
  private stackGroups: Map<string, StackedVerticalBarChartSeriesOptions> = new Map();
  private isNormalized: boolean = false;

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new StackedVerticalD3BarChartBuilder instance
   */
  static create(): StackedVerticalD3BarChartBuilder {
    return new StackedVerticalD3BarChartBuilder();
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
    return 'stacked-vertical-bar';
  }

  /**
   * Get default series options for stacked vertical bar chart
   */
  private getDefaultSeriesOptions(): StackedVerticalBarChartSeriesOptions {
    return {
      name: 'Stacked Vertical Bar Chart',
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
   * Transform generic data array to stacked vertical bar chart format
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
        
        const seriesOptions: StackedVerticalBarChartSeriesOptions = {
          name: stackName,
          type: 'bar',
          stack: this.isNormalized ? 'percent' : 'total',
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
      console.error('Error transforming stacked vertical bar chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the stacked vertical bar chart
   */
  override setData(data: any): this {
    super.setData(data);
    return this;
  }

  /**
   * Set categories for the stacked vertical bar chart (X-axis)
   */
  setCategories(categories: string[]): this {
    this.categories = categories;
    if (this.chartOptions.xAxis) {
      this.chartOptions.xAxis.data = categories;
    }
    return this;
  }

  /**
   * Enable normalization (percentage mode) for stacked bars
   */
  enableNormalization(): this {
    this.isNormalized = true;
    
    // Update Y-axis for percentage display
    if (!this.chartOptions.yAxis) {
      this.chartOptions.yAxis = {};
    }
    this.chartOptions.yAxis.max = 100;
    this.chartOptions.yAxis.axisLabel = {
      formatter: '{value}%'
    };

    // Update existing series stack property
    this.stackGroups.forEach(series => {
      series.stack = 'percent';
    });

    return this;
  }

  /**
   * Disable normalization (return to absolute values)
   */
  disableNormalization(): this {
    this.isNormalized = false;
    
    // Reset Y-axis
    if (this.chartOptions.yAxis) {
      delete this.chartOptions.yAxis.max;
      delete this.chartOptions.yAxis.axisLabel;
    }

    // Update existing series stack property
    this.stackGroups.forEach(series => {
      series.stack = 'total';
    });

    return this;
  }

  /**
   * Add a series to the stacked vertical bar chart
   */
  override addSeries(series: any): this {
    return super.addSeries(series);
  }

  /**
   * Add a series to the stacked vertical bar chart with name, data and stack
   */
  addStackedSeries(name: string, data: number[], stack?: string): this {
    const seriesOptions: StackedVerticalBarChartSeriesOptions = {
      name,
      type: 'bar',
      stack: stack || (this.isNormalized ? 'percent' : 'total'),
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
   * Set colors for the stacked vertical bar chart
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
   * Set Y-axis name (value axis for vertical bars)
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
   * Set X-axis name (category axis for vertical bars)
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
    this.setYAxisName('Revenue')
      .setXAxisName('Time Period')
      .setCurrencyFormatter('USD', 'en-US')
      .setPredefinedPalette('finance');
    return this;
  }

  /**
   * Set performance configuration preset
   */
  setPerformanceConfiguration(): this {
    this.setYAxisName('Performance Score')
      .setXAxisName('Metrics')
      .setPercentageFormatter(1)
      .setPredefinedPalette('business');
    return this;
  }

  /**
   * Set comparison configuration preset
   */
  setComparisonConfiguration(): this {
    this.setYAxisName('Value')
      .setXAxisName('Categories')
      .setCustomNumberFormatter(0, 'en-US')
      .setPredefinedPalette('modern');
    return this;
  }

  /**
   * Set distribution analysis configuration preset (with normalization)
   */
  setDistributionAnalysisConfiguration(): this {
    this.enableNormalization()
      .setYAxisName('Distribution (%)')
      .setXAxisName('Categories')
      .setPercentageFormatter(1)
      .setPredefinedPalette('pastel');
    return this;
  }

  /**
   * Build the widget with all configurations
   */
  override build(): IWidget {
    return super.build();
  }

  /**
   * Update widget data with enhanced transformation and retry mechanism
   */
  static override updateData(widget: IWidget, data: any[]): void {
    if (!widget?.config?.options) {
      return;
    }

    const stackGroups = new Map<string, Map<string, number>>();
    const categories = new Set<string>();

    data.forEach((item) => {
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
    const series = Array.from(stackGroups.entries()).map(([stackName, stackData]) => ({
      name: stackName,
      data: categoriesArray.map((category) => ({
        name: category,
        value: stackData.get(category) || 0,
      })),
    }));

    const spec = widget.config.options as import('../../chart-spec').D3ChartSpec;
    widget.config.options = {
      ...spec,
      categories: categoriesArray,
      series,
      stacked: true,
    };
    D3ChartBuilder.updateData(widget, data);
  }

  /**
   * Check if widget is a stacked vertical bar chart
   */
  static isStackedVerticalBarChart(widget: IWidget): boolean {
    return widget?.['type'] === 'stacked-vertical-bar' || widget?.['chartType'] === 'stacked-vertical-bar';
  }

  /**
   * Export chart data to various formats
   */
  static override exportData(widget: IWidget): any[] {
    const spec = widget.config?.options as import('../../chart-spec').D3ChartSpec;
    if (!spec?.series?.length) {
      return [];
    }

    const exportData: any[] = [];
    const categories = spec.categories ?? [];

    spec.series.forEach((series: { name?: string; data?: unknown[] }) => {
      if (Array.isArray(series.data)) {
        series.data.forEach((raw: unknown, index: number) => {
          const value =
            typeof raw === 'number'
              ? raw
              : Number((raw as { value?: number })?.value ?? 0);
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
    return String(widget.config?.header?.title || 'Stacked Vertical Bar Chart Data');
  }
}