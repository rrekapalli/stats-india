import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette, FilterBy } from '../apache-echart-builder';
import { getMoneytreeChartUiColors } from '../../theme/chart-ui-colors';

export interface HorizontalBarChartData {
  name: string;
  value: number;
}

export interface DatasetSource {
  source: (string | number)[][];
}

export interface EncodeMapping {
  x?: string | number;
  y?: string | number;
  tooltip?: string | number;
  itemName?: string | number;
  seriesName?: string | number;
}

export interface HorizontalBarChartSeriesOptions {
  name?: string;
  type?: string;
  data?: number[] | HorizontalBarChartData[];
  encode?: EncodeMapping;
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
  label?: {
    show?: boolean;
    position?: string;
    formatter?: (params: any) => string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  };
}

export interface HorizontalBarChartOptions {
  xAxis?: any;
  yAxis?: any;
  series?: HorizontalBarChartSeriesOptions[];
  dataset?: DatasetSource;
  visualMap?: {
    orient?: 'horizontal' | 'vertical';
    left?: string | number;
    min?: number;
    max?: number;
    text?: string[];
    dimension?: number;
    inRange?: {
      color?: string[];
    };
  };
}

/**
 * Horizontal Bar Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Horizontal orientation with categories on Y-axis and values on X-axis
 * - Generic data transformation from any[] to horizontal bar chart format
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with generic data transformation
 * const widget = HorizontalBarChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ nameField: 'category', valueField: 'amount' })
 *   .setCategories(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
 *   .setHeader('Monthly Sales')
 *   .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with presets and formatting
 * const widget = HorizontalBarChartBuilder.create()
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
 * HorizontalBarChartBuilder.updateData(widget, newData);
 */
export class HorizontalBarChartBuilder extends ApacheEchartBuilder<HorizontalBarChartOptions, HorizontalBarChartSeriesOptions> {
  private categories: string[] = [];
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new HorizontalBarChartBuilder instance
   */
  static create(): HorizontalBarChartBuilder {
    return new HorizontalBarChartBuilder();
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
        trigger: 'item',
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
        axisLabel: {
          show: true,
          interval: 0,
          rotate: 0,
          margin: 8,
          fontSize: 12,
          color: '#666'
        },
        axisTick: {
          show: true,
          alignWithLabel: true
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#ccc'
          }
        }
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'horizontal-bar';
  }

  /**
   * Get default series options for horizontal bar chart
   */
  private getDefaultSeriesOptions(): HorizontalBarChartSeriesOptions {
    const ui = getMoneytreeChartUiColors();
    return {
      name: 'Horizontal Bar Chart',
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
      label: {
        show: true,
        position: 'insideRight',
        formatter: (params: any) => {
          // Default formatting for numbers
          if (typeof params.value === 'number') {
            return params.value.toLocaleString();
          }
          return params.value;
        },
        fontSize: 12,
        fontWeight: 'normal',
        color: ui.onPrimary,
      },
    };
  }

  /**
   * Transform generic data array to horizontal bar chart format
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
      console.error('Error transforming horizontal bar chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the horizontal bar chart
   */
  override setData(data: any): this {
    super.setData(data);
    
    // Auto-extract categories from data if not already set and data is available
    if (data && Array.isArray(data) && data.length > 0 && this.categories.length === 0) {
      this.autoExtractCategories(data);
    }
    
    return this;
  }

  /**
   * Auto-extract categories from data for Y-axis labels
   */
  private autoExtractCategories(data: any[]): void {
    try {
      // Try to extract categories based on filterColumn first
      if (this.filterColumn && data[0] && data[0][this.filterColumn]) {
        const uniqueCategories = [...new Set(data.map(item => item[this.filterColumn]))];
        this.setCategories(uniqueCategories);
        return;
      }
      
      // Fallback to common field names
      const possibleNameFields = ['name', 'category', 'industry', 'sector', 'product', 'label'];
      for (const field of possibleNameFields) {
        if (data[0] && data[0][field]) {
          const uniqueCategories = [...new Set(data.map(item => item[field]))];
          this.setCategories(uniqueCategories);
          return;
        }
      }
      
      // If no suitable field found, use indices
      this.setCategories(data.map((_, index) => `Item ${index + 1}`));
      
    } catch (error) {
      console.error('Error auto-extracting categories for horizontal bar chart:', error);
    }
  }

  /**
   * Set categories for the horizontal bar chart (Y-axis)
   */
  setCategories(categories: string[]): this {
    this.categories = categories;
    if (this.chartOptions.yAxis) {
      this.chartOptions.yAxis.data = categories;
    }
    return this;
  }

  /**
   * Set dataset source for the horizontal bar chart (dataset-encode pattern)
   */
  setDatasetSource(source: (string | number)[][]): this {
    this.chartOptions.dataset = { source };
    return this;
  }

  /**
   * Set encode mapping for the series (dataset-encode pattern)
   */
  setEncode(encode: EncodeMapping): this {
    this.seriesOptions.encode = encode;
    return this;
  }

  /**
   * Set visual map for dynamic coloring based on data dimensions
   */
  setVisualMap(config: {
    orient?: 'horizontal' | 'vertical';
    left?: string | number;
    min?: number;
    max?: number;
    text?: string[];
    dimension?: number;
    colors?: string[];
  }): this {
    this.chartOptions.visualMap = {
      orient: config.orient || 'horizontal',
      left: config.left || 'center',
      min: config.min || 0,
      max: config.max || 100,
      text: config.text || ['High', 'Low'],
      dimension: config.dimension || 0,
      inRange: {
        color: config.colors || ['#65B581', '#FFCE34', '#FD665F']
      }
    };
    return this;
  }

  /**
   * Set colors for the horizontal bar chart
   */
  override setColors(colors: string[]): this {
    if (this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle.color = colors;
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
  override setFilterColumn(column: string, filterBy: FilterBy = FilterBy.Value): this {
    this.filterColumn = column;
    return super.setFilterColumn(column, filterBy);
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
    const sampleData = Array.from({ length: count }, (_, i) => ({
      name: `Category ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100
    }));
    
    this.setData(sampleData);
    return this;
  }

  /**
   * Set sales revenue configuration preset
   */
  setSalesRevenueConfiguration(): this {
    this.setXAxisName('Revenue')
      .setYAxisName('Products')
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
   * Set dataset-encode configuration preset (matches ECharts dataset-encode0 example)
   */
  setDatasetEncodeConfiguration(): this {
    // Set up encode mapping for horizontal bar chart
    this.setEncode({
      x: 'amount',  // Map amount column to X axis
      y: 'product'  // Map product column to Y axis
    });

    // Set up visual map for score-based coloring
    this.setVisualMap({
      orient: 'horizontal',
      left: 'center',
      min: 10,
      max: 100,
      text: ['High Score', 'Low Score'],
      dimension: 0, // Map the score column (first data column) to color
      colors: ['#65B581', '#FFCE34', '#FD665F']
    });

    // Configure axes for dataset mode
    this.setXAxisName('amount');
    
    // Fix Y-axis for dataset-encode mode - remove explicit data array
    if (this.chartOptions.yAxis) {
      delete this.chartOptions.yAxis.data;
    }
    
    // Fix tooltip for dataset-encode mode
    this.chartOptions.tooltip = {
      trigger: 'item',
      formatter: function(params: any) {
        return `${params.name}: ${params.value[1]}`;
      }
    };
    
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

        if (widget['chartOptions'].yAxis) {
          widget['chartOptions'].yAxis.data = transformedData.map(item => item.name);
        }

        // Trigger chart update if chart instance exists
        if (widget.chartInstance && typeof widget.chartInstance.setOption === 'function') {
          widget.chartInstance.setOption(widget['chartOptions'], true);
        }

      } catch (error) {
        console.error(`Error updating horizontal bar chart data (attempt ${attempt}):`, error);
        if (attempt < 3) {
          setTimeout(() => updateWithRetry(attempt + 1), 100 * attempt);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Check if widget is a horizontal bar chart
   */
  static isHorizontalBarChart(widget: IWidget): boolean {
    return widget?.['type'] === 'horizontal-bar' || widget?.['chartType'] === 'horizontal-bar';
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
            Value: item.value
          };
        }
        return { Value: item };
      });
    }

    return [];
  }

  /**
   * Get export headers for the chart data
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Category', 'Value'];
  }

  /**
   * Get export sheet name
   */
  static override getExportSheetName(widget: IWidget): string {
    return widget?.['header'] || 'Horizontal Bar Chart Data';
  }
}