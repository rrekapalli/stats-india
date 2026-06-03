import { IWidget, WidgetBuilder } from '../../../public-api';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../d3-chart-builder';

export interface PolarChartData {
  value: number;
  name: string;
  [key: string]: any;
}

export interface PolarChartSeriesOptions {
  name?: string;
  type?: string;
  coordinateSystem?: string;
  data?: PolarChartData[] | number[];
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
    color?: string | object;
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
  smooth?: boolean;
  stack?: string;
  sampling?: string;
}

export interface PolarChartOptions {
  polar?: {
    center?: string | string[];
    radius?: string | string[];
    startAngle?: number;
    endAngle?: number;
  };
  angleAxis?: {
    type?: string;
    startAngle?: number;
    endAngle?: number;
    min?: number;
    max?: number;
    axisLabel?: {
      color?: string;
      fontSize?: number;
    };
  };
  radiusAxis?: {
    type?: string;
    min?: number;
    max?: number;
    axisLabel?: {
      color?: string;
      fontSize?: number;
    };
  };
  series?: PolarChartSeriesOptions[];
}

/**
 * Enhanced Polar Chart Builder extending the generic D3ChartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to polar format
 * - Advanced formatting (currency, percentage, number)
 * - Predefined color palettes
 * - Filter integration
 * - Sample data generation
 * - Configuration presets for performance analysis
 * - Enhanced update methods with retry mechanism
 */
export class D3PolarChartBuilder extends D3ChartBuilder<PolarChartOptions, PolarChartSeriesOptions> {
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new D3PolarChartBuilder instance
   */
  static create(): D3PolarChartBuilder {
    return new D3PolarChartBuilder();
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
        formatter: '{b}: {c}',
      },
      legend: {
        show: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '10',
      },
      polar: {
        center: ['50%', '50%'],
        radius: ['30%', '80%'],
        startAngle: 0,
        endAngle: 360,
      },
      angleAxis: {
        type: 'value',
        startAngle: 0,
        endAngle: 360,
        min: 0,
        max: 100,
        axisLabel: {
          color: '#666',
          fontSize: 12,
        },
      },
      radiusAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#666',
          fontSize: 12,
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
   * Get default series options for polar chart
   */
  private getDefaultSeriesOptions(): PolarChartSeriesOptions {
    return {
      name: 'Polar Chart',
      type: 'line',
      coordinateSystem: 'polar',
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
      areaStyle: {
        color: '#5470c6',
        opacity: 0.3,
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
   * Set the data for the polar chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data;
    super.setData(data);
    return this;
  }

  /**
   * Set polar center position
   */
  setPolarCenter(center: string | string[]): this {
    (this.chartOptions as any).polar.center = center;
    return this;
  }

  /**
   * Set polar radius
   */
  setPolarRadius(radius: string | string[]): this {
    (this.chartOptions as any).polar.radius = radius;
    return this;
  }

  /**
   * Set start angle
   */
  setStartAngle(angle: number): this {
    (this.chartOptions as any).polar.startAngle = angle;
    (this.chartOptions as any).angleAxis.startAngle = angle;
    return this;
  }

  /**
   * Set end angle
   */
  setEndAngle(angle: number): this {
    (this.chartOptions as any).polar.endAngle = angle;
    (this.chartOptions as any).angleAxis.endAngle = angle;
    return this;
  }

  /**
   * Set angle axis range
   */
  setAngleAxisRange(min: number, max: number): this {
    (this.chartOptions as any).angleAxis.min = min;
    (this.chartOptions as any).angleAxis.max = max;
    return this;
  }

  /**
   * Set radius axis range
   */
  setRadiusAxisRange(min: number, max: number): this {
    (this.chartOptions as any).radiusAxis.min = min;
    (this.chartOptions as any).radiusAxis.max = max;
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
   * Set item style (symbol color, border, etc.)
   */
  setItemStyle(color: string, borderColor?: string, borderWidth?: number): this {
    this.seriesOptions.itemStyle = {
      color,
      borderColor,
      borderWidth,
    };
    return this;
  }

  /**
   * Set area style with color and opacity
   */
  setAreaStyle(color: string, opacity: number = 0.3): this {
    this.seriesOptions.areaStyle = {
      color,
      opacity,
    };
    return this;
  }

  /**
   * Set gradient area style
   */
  setGradientAreaStyle(startColor: string, endColor: string, opacity: number = 0.3): this {
    this.seriesOptions.areaStyle = {
      color: {
        type: 'radial',
        x: 0.5,
        y: 0.5,
        r: 0.5,
        colorStops: [
          { offset: 0, color: startColor },
          { offset: 1, color: endColor }
        ],
      },
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
   * Set stack for stacked polar charts
   */
  setStack(stack: string): this {
    this.seriesOptions.stack = stack;
    return this;
  }

  /**
   * Set sampling method for large datasets
   */
  setSampling(sampling: string): this {
    this.seriesOptions.sampling = sampling;
    return this;
  }

  /**
   * Transform generic data to polar format
   */
  transformData(options: { 
    valueField?: string; 
    nameField?: string; 
    categoryField?: string; 
  } & ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      valueField = 'value',
      nameField = 'name',
      categoryField = 'category',
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      let transformedData: number[] = [];

      // Apply filters first
      let filteredData = this.data;
      if ((options as any).filters && (options as any).filters.length > 0) {
        filteredData = D3ChartBuilder.applyFilters(this.data, (options as any).filters);
      }

      // Transform data to polar format
      filteredData.forEach(item => {
        const value = parseFloat(item[valueField]) || 0;
        transformedData.push(value);
      });

      // Apply sorting
      if (sortBy === 'value') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a - b : b - a);
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      this.seriesOptions.data = transformedData;

    } catch (error) {
      console.error('Error transforming polar chart data:', error);
    }

    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length > 0) {
      this.setItemStyle(colors[0]);
      this.setLineStyle(2, colors[0]);
    }
    return this;
  }

  /**
   * Set currency formatter for values
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setTooltip('item', (params: any) => {
      return `${params.seriesName}: ${formatter(params.value)}`;
    });
    return this;
  }

  /**
   * Set percentage formatter for values
   */
  override setPercentageFormatter(decimals: number = 1): this {
    const formatter = this.createPercentageFormatter(decimals);
    this.setTooltip('item', (params: any) => {
      return `${params.seriesName}: ${formatter(params.value)}`;
    });
    return this;
  }

  /**
   * Set number formatter for values with custom options
   */
  setCustomNumberFormatter(decimals: number = 0, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setTooltip('item', (params: any) => {
      return `${params.seriesName}: ${formatter(params.value)}`;
    });
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
  generateSampleData(count: number = 8): this {
    const sampleData = [];
    
    for (let i = 0; i < count; i++) {
      sampleData.push({
        value: Math.floor(Math.random() * 100) + 10,
        name: `Metric ${i + 1}`,
        angle: (360 / count) * i,
        category: ['Performance', 'Quality', 'Efficiency'][Math.floor(Math.random() * 3)],
        department: ['Sales', 'Marketing', 'Operations'][Math.floor(Math.random() * 3)]
      });
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for performance metrics
   */
  setPerformanceMetricsConfiguration(): this {
    return this
      .setPredefinedPalette('business')
      .setPercentageFormatter(1)
      .setPolarRadius(['20%', '80%'])
      .setAreaStyle('#5470c6', 0.3)
      .setSmooth(true);
  }

  /**
   * Configuration preset for radar analysis
   */
  setRadarAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('finance')
      .setCustomNumberFormatter(0, 'en-US')
      .setPolarRadius(['30%', '90%'])
      .setLineStyle(3, '#91cc75', 'solid')
      .setSymbol('circle', 6);
  }

  /**
   * Configuration preset for 360-degree view
   */
  set360ViewConfiguration(): this {
    return this
      .setPredefinedPalette('modern')
      .setCurrencyFormatter('USD', 'en-US')
      .setPolarRadius(['10%', '95%'])
      .setStartAngle(0)
      .setEndAngle(360)
      .setAreaStyle('#ee6666', 0.4);
  }

  /**
   * Build the widget with polar chart configuration
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
   * Check if widget is a polar chart
   */
  static isPolarChart(widget: IWidget): boolean {
    const options = widget.config?.options as any;
    return options?.series?.[0]?.coordinateSystem === 'polar';
  }

  /**
   * Create polar chart widget with default configuration
   */
  static createPolarChartWidget(data?: PolarChartData[] | number[]): WidgetBuilder {
    const builder = new WidgetBuilder()
      .setComponent('echart')
      .setEChartsOptions({
        grid: {
          containLabel: true,
          top: '15%',
          left: '10%',
          right: '10%',
          bottom: '15%',
        },
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}',
        },
        legend: {
          show: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '10',
        },
        polar: {
          center: ['50%', '50%'],
          radius: ['30%', '80%'],
          startAngle: 0,
          endAngle: 360,
        },
        angleAxis: {
          type: 'value',
          startAngle: 0,
          endAngle: 360,
          min: 0,
          max: 100,
          axisLabel: {
            color: '#666',
            fontSize: 12,
          },
        },
        radiusAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            color: '#666',
            fontSize: 12,
          },
        },
        series: [{
          name: 'Polar Chart',
          type: 'line',
          coordinateSystem: 'polar',
          data: data || [],
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
          areaStyle: {
            color: '#5470c6',
            opacity: 0.3,
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        }],
      });

    return builder;
  }

  /**
   * Export data from polar chart widget
   */
  static override exportData(widget: IWidget): any[] {
    if (!D3PolarChartBuilder.isPolarChart(widget)) {
      return [];
    }

    const options = widget.config?.options as any;
    const series = options?.series;

    if (!series || series.length === 0) return [];

    const data: any[] = [];
    series.forEach((s: any, index: number) => {
      if (s.data) {
        s.data.forEach((value: any, pointIndex: number) => {
          if (index === 0) {
            data[pointIndex] = [`Point ${pointIndex + 1}`];
          }
          if (data[pointIndex]) {
            data[pointIndex].push(value || 0);
          }
        });
      }
    });

    return data;
  }

  /**
   * Get export headers for polar chart
   */
  static override getExportHeaders(widget: IWidget): string[] {
    const options = widget.config?.options as any;
    const series = options?.series;
    if (!series || series.length === 0) return ['Angle'];
    return ['Angle', ...series.map((s: any) => s.name || 'Series')];
  }

  /**
   * Get export sheet name for polar chart
   */
  static override getExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Polar Chart';
    return `PolarChart_${title.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }
}

/**
 * Factory function to create polar chart widget
 */
export function createPolarChartWidget(data?: PolarChartData[] | number[]): WidgetBuilder {
  return D3PolarChartBuilder.createPolarChartWidget(data);
} 