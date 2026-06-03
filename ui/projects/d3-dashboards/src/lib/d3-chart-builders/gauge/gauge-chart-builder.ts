import { IWidget, WidgetBuilder } from '../../../public-api';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../d3-chart-builder';

export interface GaugeChartData {
  value: number;
  name?: string;
  [key: string]: any;
}

export interface GaugeChartSeriesOptions {
  name?: string;
  type?: string;
  data?: GaugeChartData[];
  min?: number;
  max?: number;
  startAngle?: number;
  endAngle?: number;
  radius?: string | string[];
  center?: string | string[];
  axisLine?: {
    lineStyle?: {
      width?: number;
      color?: Array<[number, string]>;
    };
  };
  progress?: {
    show?: boolean;
    width?: number;
  };
  pointer?: {
    show?: boolean;
    length?: string | number;
    width?: number;
  };
  axisTick?: {
    show?: boolean;
    splitNumber?: number;
    length?: number;
    lineStyle?: {
      width?: number;
      color?: string;
    };
  };
  splitLine?: {
    show?: boolean;
    length?: number;
    lineStyle?: {
      width?: number;
      color?: string;
    };
  };
  axisLabel?: {
    show?: boolean;
    distance?: number;
    color?: string;
    fontSize?: number;
  };
  title?: {
    show?: boolean;
    offsetCenter?: [number, number];
    color?: string;
    fontSize?: number;
  };
  detail?: {
    show?: boolean;
    offsetCenter?: [number, number];
    color?: string;
    fontSize?: number;
    formatter?: string;
  };
  itemStyle?: {
    color?: string;
  };
}

export interface GaugeChartOptions {
  series?: GaugeChartSeriesOptions[];
}

/**
 * Enhanced Gauge Chart Builder extending the generic D3ChartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to gauge chart format
 * - Support for KPI monitoring and progress tracking
 * - Predefined color palettes and gradients
 * - Built-in formatters for currency, percentage, and numbers
 * - Filter integration and sample data generation
 * - Configuration presets for common use cases
 * - Enhanced update methods with retry mechanisms
 * 
 * Usage examples:
 * 
 * // Basic usage with generic data transformation
 * const widget = D3GaugeChartBuilder.create()
 *   .setData(genericDataArray)
 *   .transformData({ valueField: 'progress', nameField: 'title' })
 *   .setHeader('Progress Monitor')
 *   .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with KPI monitoring
 * const widget = D3GaugeChartBuilder.create()
 *   .setData(kpiData)
 *   .transformData({ valueField: 'current', nameField: 'metric' })
 *   .setKPIMonitoringConfiguration()
 *   .setPercentageFormatter(0)
 *   .setPredefinedPalette('business')
 *   .setFilterColumn('department')
 *   .setHeader('KPI Dashboard')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Update with enhanced data transformation
 * D3GaugeChartBuilder.updateData(widget, newData);
 */
export class D3GaugeChartBuilder extends D3ChartBuilder<GaugeChartOptions, GaugeChartSeriesOptions> {
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new D3GaugeChartBuilder instance
   */
  static create(): D3GaugeChartBuilder {
    return new D3GaugeChartBuilder();
  }

  /**
   * Implement abstract method to get default options
   */
  protected override getDefaultOptions(): any {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'gauge';
  }

  /**
   * Get default series options for gauge chart
   */
  private getDefaultSeriesOptions(): GaugeChartSeriesOptions {
    return {
      name: 'Gauge Chart',
      type: 'gauge',
      min: 0,
      max: 100,
      startAngle: 180,
      endAngle: 0,
      radius: '75%',
      center: ['50%', '60%'],
      axisLine: {
        lineStyle: {
          width: 30,
          color: [[0.3, '#ff6e76'], [0.7, '#fddd60'], [1, '#58d9f9']],
        },
      },
      progress: {
        show: true,
        width: 8,
      },
      pointer: {
        show: true,
        length: '60%',
        width: 8,
      },
      axisTick: {
        show: true,
        splitNumber: 5,
        length: 8,
        lineStyle: {
          width: 2,
          color: '#999',
        },
      },
      splitLine: {
        show: true,
        length: 30,
        lineStyle: {
          width: 4,
          color: '#999',
        },
      },
      axisLabel: {
        show: true,
        distance: 5,
        color: '#999',
        fontSize: 12,
      },
      title: {
        show: true,
        offsetCenter: [0, 70],
        color: '#464646',
        fontSize: 14,
      },
      detail: {
        show: true,
        offsetCenter: [0, 40],
        color: '#464646',
        fontSize: 30,
        formatter: '{value}%',
      },
    };
  }

  /**
   * Transform generic data array to gauge chart format
   */
  transformData(options: ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      nameField = 'name',
      valueField = 'value',
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      let transformedData = this.data.map(item => ({
        value: parseFloat(item[valueField]) || 0,
        name: item[nameField] || 'Gauge',
        originalItem: item
      }));

      // Apply sorting
      if (sortBy === 'value') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value - b.value : b.value - a.value);
      } else if (sortBy === 'name') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      }

      // Apply limit (typically gauge shows single value)
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      // For gauge, usually we show the first/primary value
      this.seriesOptions.data = transformedData.length > 0 ? [transformedData[0]] : [];

    } catch (error) {
      console.error('Error transforming gauge chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the gauge chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = Array.isArray(data) ? data : [data];
    super.setData(data);
    return this;
  }

  /**
   * Set gauge range
   */
  setRange(min: number, max: number): this {
    this.seriesOptions.min = min;
    this.seriesOptions.max = max;
    return this;
  }

  /**
   * Set gauge angles
   */
  setAngles(startAngle: number, endAngle: number): this {
    this.seriesOptions.startAngle = startAngle;
    this.seriesOptions.endAngle = endAngle;
    return this;
  }

  /**
   * Set gauge radius
   */
  setRadius(radius: string | string[]): this {
    this.seriesOptions.radius = radius;
    return this;
  }

  /**
   * Set gauge center position
   */
  setCenter(center: string | string[]): this {
    this.seriesOptions.center = center;
    return this;
  }

  /**
   * Set axis line configuration
   */
  setAxisLine(width: number, colors: Array<[number, string]>): this {
    this.seriesOptions.axisLine = {
      lineStyle: {
        width,
        color: colors,
      },
    };
    return this;
  }

  /**
   * Set progress bar configuration
   */
  setProgress(show: boolean, width: number = 8): this {
    this.seriesOptions.progress = {
      show,
      width,
    };
    return this;
  }

  /**
   * Set pointer configuration
   */
  setPointer(show: boolean, length: string | number = '60%', width: number = 8): this {
    this.seriesOptions.pointer = {
      show,
      length,
      width,
    };
    return this;
  }

  /**
   * Set axis tick configuration
   */
  setAxisTick(show: boolean, splitNumber: number = 5, length: number = 8, width: number = 2, color: string = '#999'): this {
    this.seriesOptions.axisTick = {
      show,
      splitNumber,
      length,
      lineStyle: {
        width,
        color,
      },
    };
    return this;
  }

  /**
   * Set split line configuration
   */
  setSplitLine(show: boolean, length: number = 30, width: number = 4, color: string = '#999'): this {
    this.seriesOptions.splitLine = {
      show,
      length,
      lineStyle: {
        width,
        color,
      },
    };
    return this;
  }

  /**
   * Set axis label configuration
   */
  setAxisLabel(show: boolean, distance: number = 5, color: string = '#999', fontSize: number = 12): this {
    this.seriesOptions.axisLabel = {
      show,
      distance,
      color,
      fontSize,
    };
    return this;
  }

  /**
   * Set gauge title configuration
   */
  setGaugeTitle(show: boolean, offsetCenter: [number, number] = [0, 70], color: string = '#464646', fontSize: number = 14): this {
    this.seriesOptions.title = {
      show,
      offsetCenter,
      color,
      fontSize,
    };
    return this;
  }

  /**
   * Set detail configuration
   */
  setDetail(show: boolean, offsetCenter: [number, number] = [0, 40], color: string = '#464646', fontSize: number = 30, formatter: string = '{value}%'): this {
    this.seriesOptions.detail = {
      show,
      offsetCenter,
      color,
      fontSize,
      formatter,
    };
    return this;
  }

  /**
   * Set predefined color palette for axis line
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    const colorStops: Array<[number, string]> = [];
    
    for (let i = 0; i < colors.length && i < 3; i++) {
      colorStops.push([(i + 1) / 3, colors[i]]);
    }
    
    if (colorStops.length === 0) {
      colorStops.push([0.3, '#ff6e76'], [0.7, '#fddd60'], [1, '#58d9f9']);
    }
    
    this.setAxisLine(30, colorStops);
    return this;
  }

  /**
   * Set currency formatter for gauge
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setDetail(true, [0, 40], '#464646', 30, `{value | ${formatter.name}}`);
    return this;
  }

  /**
   * Set percentage formatter for gauge
   */
  override setPercentageFormatter(decimals: number = 1): this {
    this.setDetail(true, [0, 40], '#464646', 30, `{value}%`);
    return this;
  }

  /**
   * Set number formatter for gauge with custom options
   */
  setCustomNumberFormatter(decimals: number = 0, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setDetail(true, [0, 40], '#464646', 30, `{value}`);
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
  generateSampleData(count: number = 1): this {
    const sampleData = [];
    
    for (let i = 0; i < count; i++) {
      sampleData.push({
        value: Math.floor(Math.random() * 100),
        name: `Gauge ${i + 1}`,
        progress: Math.floor(Math.random() * 100),
        target: 100,
        category: ['Performance', 'Efficiency', 'Quality'][Math.floor(Math.random() * 3)]
      });
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for KPI monitoring
   */
  setKPIMonitoringConfiguration(): this {
    return this
      .setRange(0, 100)
      .setRadius('70%')
      .setCenter(['50%', '55%'])
      .setProgress(true, 10)
      .setPointer(true, '70%', 6)
      .setPredefinedPalette('business')
      .setDetail(true, [0, 70], '#333', 24, '{value}%')
      .setGaugeTitle(true, [0, -30], '#666', 16);
  }

  /**
   * Configuration preset for performance tracking
   */
  setPerformanceTrackingConfiguration(): this {
    return this
      .setRange(0, 100)
      .setRadius('80%')
      .setCenter(['50%', '60%'])
      .setProgress(true, 15)
      .setPointer(false)
      .setPredefinedPalette('finance')
      .setDetail(true, [0, 10], '#333', 32, '{value}%')
      .setGaugeTitle(true, [0, -40], '#666', 18);
  }

  /**
   * Configuration preset for progress indicator
   */
  setProgressIndicatorConfiguration(): this {
    return this
      .setRange(0, 100)
      .setRadius('60%')
      .setCenter(['50%', '50%'])
      .setProgress(true, 8)
      .setPointer(true, '60%', 4)
      .setPredefinedPalette('modern')
      .setDetail(true, [0, 60], '#333', 20, '{value}%')
      .setGaugeTitle(true, [0, -50], '#666', 14);
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
   * Static method to check if a widget is a gauge chart
   */
  static isGaugeChart(widget: IWidget): boolean {
    return D3ChartBuilder.isChartType(widget, 'gauge');
  }

  /**
   * Static method to create gauge chart widget
   */
  static createGaugeChartWidget(data?: GaugeChartData[]): WidgetBuilder {
    const builder = D3GaugeChartBuilder.create();
    
    if (data) {
      builder.setData(data);
    }
    
    return builder.getWidgetBuilder();
  }

  /**
   * Export gauge chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const spec = widget.config?.options as import('../../chart-spec').D3ChartSpec;
    const g = spec?.gauge;
    if (!g) {
      return [];
    }
    const max = g.max ?? 100;
    return [
      {
        Name: g.name || 'Gauge',
        Value: g.value,
        Percentage: this.calculatePercentage(g.value, max),
      },
    ];
  }

  /**
   * Get export headers for Excel/CSV export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Name', 'Value', 'Percentage'];
  }

  /**
   * Get export sheet name for Excel export
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Gauge Chart Data';
  }

  /**
   * Calculate percentage for export
   */
  private static calculatePercentage(value: number, max: number): string {
    const percentage = (value / max) * 100;
    return `${percentage.toFixed(1)}%`;
  }
}

// Legacy function for backward compatibility
export function createGaugeChartWidget(data?: GaugeChartData[]): WidgetBuilder {
  return D3GaugeChartBuilder.createGaugeChartWidget(data);
} 