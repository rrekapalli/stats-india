import { IWidget, WidgetBuilder } from '../../../public-api';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../d3-chart-builder';

export interface ScatterChartData {
  value: [number, number]; // [x, y] coordinates
  name?: string;
  symbolSize?: number;
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
  [key: string]: any;
}

export interface ScatterChartSeriesOptions {
  name?: string;
  type?: string;
  data?: ScatterChartData[];
  symbolSize?: number | Function;
  symbol?: string;
  itemStyle?: {
    color?: string | string[];
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  emphasis?: {
    focus?: string;
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
  large?: boolean;
  largeThreshold?: number;
  progressive?: number;
  progressiveThreshold?: number;
}

export interface ScatterChartOptions {
  xAxis?: {
    type?: string;
    name?: string;
    nameLocation?: string;
    scale?: boolean;
    axisLabel?: {
      color?: string;
    };
  };
  yAxis?: {
    type?: string;
    name?: string;
    nameLocation?: string;
    scale?: boolean;
    axisLabel?: {
      color?: string;
    };
  };
  series?: ScatterChartSeriesOptions[];
}

/**
 * Enhanced Scatter Chart Builder extending the generic D3ChartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to scatter chart format
 * - Support for correlation analysis and trend visualization
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with generic data transformation
 * const widget = D3ScatterChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ xField: 'risk', yField: 'return' })
 *   .setHeader('Risk vs Return Analysis')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with correlation analysis
 * const widget = D3ScatterChartBuilder.create()
 *   .setData(correlationData)
 *   .transformData({ xField: 'experience', yField: 'salary' })
 *   .setCorrelationAnalysisConfiguration()
 *   .setCurrencyFormatter('USD', 'en-US')
 *   .setPredefinedPalette('finance')
 *   .setFilterColumn('department')
 *   .setHeader('Salary vs Experience Analysis')
 *   .setPosition({ x: 0, y: 0, cols: 8, rows: 4 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * D3ScatterChartBuilder.updateData(widget, newData);
 */
export class D3ScatterChartBuilder extends D3ChartBuilder<ScatterChartOptions, ScatterChartSeriesOptions> {
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new D3ScatterChartBuilder instance
   */
  static create(): D3ScatterChartBuilder {
    return new D3ScatterChartBuilder();
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
        trigger: 'item',
        formatter: '{b}: ({c})',
      },
      legend: {
        show: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '10',
      },
      xAxis: {
        type: 'value',
        nameLocation: 'middle',
        scale: true,
        axisLabel: {
          color: '#666',
        },
      },
      yAxis: {
        type: 'value',
        nameLocation: 'middle',
        scale: true,
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
    return 'scatter';
  }

  /**
   * Get default series options for scatter chart
   */
  private getDefaultSeriesOptions(): ScatterChartSeriesOptions {
    return {
      name: 'Scatter Chart',
      type: 'scatter',
      symbolSize: 8,
      symbol: 'circle',
      itemStyle: {
        color: '#5470c6',
        opacity: 0.8,
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      large: false,
      largeThreshold: 2000,
    };
  }

  /**
   * Transform generic data array to scatter chart format
   */
  transformData(options: { xField?: string; yField?: string; nameField?: string; sizeField?: string } & ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      xField = 'x',
      yField = 'y',
      nameField = 'name',
      sizeField,
      sortBy,
      sortOrder = 'asc',
      limit
    } = options;

    try {
      let transformedData = this.data.map((item, index) => ({
        value: [
          parseFloat(item[xField]) || 0,
          parseFloat(item[yField]) || 0
        ] as [number, number],
        name: item[nameField] || `Point ${index + 1}`,
        symbolSize: sizeField ? parseFloat(item[sizeField]) || 8 : 8,
        originalItem: item
      }));

      // Apply sorting
      if (sortBy === 'x') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value[0] - b.value[0] : b.value[0] - a.value[0]);
      } else if (sortBy === 'y') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value[1] - b.value[1] : b.value[1] - a.value[1]);
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      this.seriesOptions.data = transformedData;

    } catch (error) {
      console.error('Error transforming scatter chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the scatter chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data as ScatterChartData[];
    super.setData(data);
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
   * Set symbol type and size
   */
  setSymbol(symbol: string, size: number = 8): this {
    this.seriesOptions.symbol = symbol;
    this.seriesOptions.symbolSize = size;
    return this;
  }

  /**
   * Set symbol size function for dynamic sizing
   */
  setSymbolSizeFunction(sizeFunction: Function): this {
    this.seriesOptions.symbolSize = sizeFunction;
    return this;
  }

  /**
   * Set item style
   */
  setItemStyle(color: string, opacity: number = 0.8, borderColor?: string, borderWidth?: number): this {
    this.seriesOptions.itemStyle = {
      color,
      opacity,
      borderColor,
      borderWidth,
    };
    return this;
  }

  /**
   * Set large scatter mode for performance
   */
  setLargeScatter(enabled: boolean, threshold: number = 2000): this {
    this.seriesOptions.large = enabled;
    this.seriesOptions.largeThreshold = threshold;
    return this;
  }

  /**
   * Set progressive rendering
   */
  setProgressive(progressive: number, threshold: number = 3000): this {
    this.seriesOptions.progressive = progressive;
    this.seriesOptions.progressiveThreshold = threshold;
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length > 0) {
      this.setItemStyle(colors[0]);
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
  generateSampleData(count: number = 20): this {
    const sampleData = [];
    
    for (let i = 0; i < count; i++) {
      sampleData.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        name: `Point ${i + 1}`,
        size: Math.random() * 15 + 5,
        category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
        department: ['Sales', 'Marketing', 'Operations'][Math.floor(Math.random() * 3)]
      });
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for correlation analysis
   */
  setCorrelationAnalysisConfiguration(): this {
    return this
      .setSymbol('circle', 6)
      .setItemStyle('#5470c6', 0.7)
      .setLargeScatter(true, 1000)
      .setXAxisName('X Variable')
      .setYAxisName('Y Variable')
      .setPredefinedPalette('finance')
      .setTooltip('item', '{b}: ({c})');
  }

  /**
   * Configuration preset for performance analysis
   */
  setPerformanceAnalysisConfiguration(): this {
    return this
      .setSymbol('diamond', 8)
      .setItemStyle('#91cc75', 0.8)
      .setXAxisName('Performance Score')
      .setYAxisName('Efficiency Rating')
      .setPredefinedPalette('business')
      .setTooltip('item', '{b}: Performance {c}');
  }

  /**
   * Configuration preset for risk analysis
   */
  setRiskAnalysisConfiguration(): this {
    return this
      .setSymbol('triangle', 7)
      .setItemStyle('#ee6666', 0.7)
      .setXAxisName('Risk Level')
      .setYAxisName('Return Potential')
      .setPredefinedPalette('modern')
      .setTooltip('item', 'Risk: {c}');
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    return super.build();
  }

  /**
   * Enhanced updateData with retry mechanism
   */
  static override updateData(widget: IWidget, data: unknown): void {
    D3ChartBuilder.updateData(widget, data);
  }

  /**
   * Static method to check if a widget is a scatter chart
   */
  static isScatterChart(widget: IWidget): boolean {
    return D3ChartBuilder.isChartType(widget, 'scatter');
  }

  /**
   * Static method to create scatter chart widget
   */
  static createScatterChartWidget(data?: ScatterChartData[]): WidgetBuilder {
    const builder = D3ScatterChartBuilder.create();
    
    if (data) {
      builder.setData(data);
    }
    
    return builder.getWidgetBuilder();
  }

  /**
   * Export scatter chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const spec = widget.config?.options as import('../../chart-spec').D3ChartSpec;
    const seriesData = spec?.series?.[0]?.data ?? [];
    return seriesData.map((item: any, index: number) => ({
      Name: item?.name || `Point ${index + 1}`,
      'X Value': Array.isArray(item?.value) ? item.value[0] : item?.x ?? 0,
      'Y Value': Array.isArray(item?.value) ? item.value[1] : item?.value ?? 0,
    }));
  }

  /**
   * Get export headers for Excel/CSV export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Name', 'X Value', 'Y Value', 'Symbol Size'];
  }

  /**
   * Get export sheet name for Excel export
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Scatter Chart Data';
  }
}

// Legacy function for backward compatibility
export function createScatterChartWidget(data?: ScatterChartData[]): WidgetBuilder {
  return D3ScatterChartBuilder.createScatterChartWidget(data);
} 