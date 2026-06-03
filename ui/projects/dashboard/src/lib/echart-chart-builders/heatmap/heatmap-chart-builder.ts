import { IWidget, WidgetBuilder } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';

export interface HeatmapChartData {
  value: [number, number, number]; // [x, y, value]
  name?: string;
  [key: string]: any;
}

export interface HeatmapChartSeriesOptions {
  name?: string;
  type?: string;
  data?: HeatmapChartData[];
  xAxisIndex?: number;
  yAxisIndex?: number;
  itemStyle?: {
    color?: string | Function;
    borderColor?: string;
    borderWidth?: number;
  };
  emphasis?: {
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
  progressive?: number;
  progressiveThreshold?: number;
  animation?: boolean;
}

export interface HeatmapChartOptions {
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
    data?: string[];
    name?: string;
    nameLocation?: string;
    axisLabel?: {
      color?: string;
    };
  };
  visualMap?: {
    show?: boolean;
    min?: number;
    max?: number;
    calculable?: boolean;
    orient?: string;
    left?: string | number;
    top?: string | number;
    inRange?: {
      color?: string[];
    };
    text?: [string, string];
  };
  series?: HeatmapChartSeriesOptions[];
}

/**
 * Enhanced Heatmap Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to heatmap format
 * - Advanced formatting (currency, percentage, number)
 * - Predefined color palettes
 * - Filter integration
 * - Sample data generation
 * - Configuration presets for various use cases
 * - Enhanced update methods with retry mechanism
 */
export class HeatmapChartBuilder extends ApacheEchartBuilder<HeatmapChartOptions, HeatmapChartSeriesOptions> {
  private xAxisData: string[] = [];
  private yAxisData: string[] = [];
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new HeatmapChartBuilder instance
   */
  static create(): HeatmapChartBuilder {
    return new HeatmapChartBuilder();
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
        right: '15%',
        bottom: '15%',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
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
        type: 'category',
        data: [],
        nameLocation: 'middle',
        axisLabel: {
          color: '#666',
        },
      },
      visualMap: {
        show: true,
        min: 0,
        max: 10,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        top: '5%',
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
        },
        text: ['High', 'Low'],
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'heatmap';
  }

  /**
   * Get default series options for heatmap chart
   */
  private getDefaultSeriesOptions(): HeatmapChartSeriesOptions {
    return {
      name: 'Heatmap Chart',
      type: 'heatmap',
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      progressive: 1000,
      progressiveThreshold: 3000,
      animation: true,
    };
  }

  /**
   * Transform generic data to heatmap format
   */
  transformData(options: { 
    xField?: string; 
    yField?: string; 
    valueField?: string; 
    nameField?: string; 
  } & ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      xField = 'x',
      yField = 'y',
      valueField = 'value',
      nameField = 'name',
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      let transformedData: HeatmapChartData[] = [];
      const xAxisSet = new Set<string>();
      const yAxisSet = new Set<string>();

      // Apply filters first
      let filteredData = this.data;
      if ((options as any).filters && (options as any).filters.length > 0) {
        filteredData = ApacheEchartBuilder.applyFilters(this.data, (options as any).filters);
      }

      // Transform data to heatmap format [x, y, value]
      filteredData.forEach((item, index) => {
        const xValue = item[xField] || index % 10;
        const yValue = item[yField] || Math.floor(index / 10);
        const value = parseFloat(item[valueField]) || 0;
        const name = item[nameField] || `${xValue}-${yValue}`;

        // Convert to indices if they're strings
        const xIndex = typeof xValue === 'string' ? this.getAxisIndex(xValue, xAxisSet) : xValue;
        const yIndex = typeof yValue === 'string' ? this.getAxisIndex(yValue, yAxisSet) : yValue;

        transformedData.push({
          value: [xIndex, yIndex, value] as [number, number, number],
          name,
          originalItem: item
        });

        if (typeof xValue === 'string') xAxisSet.add(xValue);
        if (typeof yValue === 'string') yAxisSet.add(yValue);
      });

      // Apply sorting
      if (sortBy === 'value') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value[2] - b.value[2] : b.value[2] - a.value[2]);
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      this.seriesOptions.data = transformedData;

      // Set axis data if we have string categories
      if (xAxisSet.size > 0) {
        this.setXAxisData(Array.from(xAxisSet).sort());
      }
      if (yAxisSet.size > 0) {
        this.setYAxisData(Array.from(yAxisSet).sort());
      }

      // Update visual map range based on data
      const values = transformedData.map(item => item.value[2]);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      this.setVisualMap(minValue, maxValue);

    } catch (error) {
      console.error('Error transforming heatmap chart data:', error);
    }

    return this;
  }

  /**
   * Helper method to get axis index for string values
   */
  private getAxisIndex(value: string, axisSet: Set<string>): number {
    const sorted = Array.from(axisSet).sort();
    const index = sorted.indexOf(value);
    return index !== -1 ? index : sorted.length;
  }

  /**
   * Set the data for the heatmap chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data as HeatmapChartData[];
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
   * Set Y-axis data (categories)
   */
  setYAxisData(data: string[]): this {
    this.yAxisData = data;
    (this.chartOptions as any).yAxis = {
      ...(this.chartOptions as any).yAxis,
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
   * Set visual map configuration
   */
  setVisualMap(min: number, max: number, colors?: string[], text: [string, string] = ['High', 'Low']): this {
    (this.chartOptions as any).visualMap = {
      ...(this.chartOptions as any).visualMap,
      min,
      max,
      inRange: {
        color: colors || ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026'],
      },
      text,
    };
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length > 0) {
      (this.chartOptions as any).visualMap = {
        ...(this.chartOptions as any).visualMap,
        inRange: {
          color: colors,
        },
      };
    }
    return this;
  }

  /**
   * Set currency formatter for values
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setTooltip('item', (params: any) => {
      const [x, y, value] = params.data.value;
      return `${params.data.name || `(${x}, ${y})`}: ${formatter(value)}`;
    });
    return this;
  }

  /**
   * Set percentage formatter for values
   */
  override setPercentageFormatter(decimals: number = 1): this {
    const formatter = this.createPercentageFormatter(decimals);
    this.setTooltip('item', (params: any) => {
      const [x, y, value] = params.data.value;
      return `${params.data.name || `(${x}, ${y})`}: ${formatter(value)}`;
    });
    return this;
  }

  /**
   * Set number formatter for values with custom options
   */
  setCustomNumberFormatter(decimals: number = 1, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setTooltip('item', (params: any) => {
      const [x, y, value] = params.data.value;
      return `${params.data.name || `(${x}, ${y})`}: ${formatter(value)}`;
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
  generateSampleData(xCount: number = 7, yCount: number = 5): this {
    const sampleData = [];
    const xCategories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, xCount);
    const yCategories = ['Morning', 'Afternoon', 'Evening', 'Night', 'Late Night'].slice(0, yCount);
    
    for (let x = 0; x < xCount; x++) {
      for (let y = 0; y < yCount; y++) {
        sampleData.push({
          x: xCategories[x],
          y: yCategories[y],
          value: Math.floor(Math.random() * 100),
          category: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
          department: ['Sales', 'Marketing', 'Operations'][Math.floor(Math.random() * 3)]
        });
      }
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for activity analysis
   */
  setActivityAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('business')
      .setCustomNumberFormatter(0, 'en-US')
      .setXAxisName('Time Period')
      .setYAxisName('Activity Type')
      .setVisualMapPosition('horizontal', 'center', '5%');
  }

  /**
   * Configuration preset for correlation analysis
   */
  setCorrelationAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('modern')
      .setPercentageFormatter(2)
      .setXAxisName('Variable X')
      .setYAxisName('Variable Y')
      .setVisualMapPosition('vertical', 'right', 'center');
  }

  /**
   * Configuration preset for performance matrix
   */
  setPerformanceMatrixConfiguration(): this {
    return this
      .setPredefinedPalette('finance')
      .setCurrencyFormatter('USD', 'en-US')
      .setXAxisName('Time')
      .setYAxisName('Metrics')
      .setVisualMapPosition('horizontal', 'center', 'bottom');
  }

  /**
   * Set visual map position
   */
  setVisualMapPosition(orient: string = 'horizontal', left: string | number = 'center', top: string | number = '5%'): this {
    (this.chartOptions as any).visualMap = {
      ...(this.chartOptions as any).visualMap,
      orient,
      left,
      top,
    };
    return this;
  }

  /**
   * Set item style for heatmap cells
   */
  setItemStyle(borderColor: string = '#fff', borderWidth: number = 1): this {
    this.seriesOptions.itemStyle = {
      borderColor,
      borderWidth,
    };
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
   * Set animation
   */
  override setAnimation(animation: boolean): this {
    this.seriesOptions.animation = animation;
    return this;
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    const finalOptions: HeatmapChartOptions = {
      ...this.chartOptions,
      series: [{
        ...this.seriesOptions,
        type: 'heatmap',
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
            transformedData = data.map((item, index) => ({
              value: [
                item.x || index % 10,
                item.y || Math.floor(index / 10),
                parseFloat(item.value) || 0
              ] as [number, number, number],
              name: item.name || `${item.x || index % 10}-${item.y || Math.floor(index / 10)}`,
              ...item
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
        console.error('Error updating heatmap chart data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Static method to check if a widget is a heatmap chart
   */
  static isHeatmapChart(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'heatmap');
  }

  /**
   * Static method to create heatmap chart widget
   */
  static createHeatmapChartWidget(data?: HeatmapChartData[], xAxisData?: string[], yAxisData?: string[]): WidgetBuilder {
    const builder = HeatmapChartBuilder.create();
    
    if (data) {
      builder.setData(data);
    }
    
    if (xAxisData) {
      builder.setXAxisData(xAxisData);
    }
    
    if (yAxisData) {
      builder.setYAxisData(yAxisData);
    }
    
    return builder.getWidgetBuilder();
  }

  /**
   * Export heatmap chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const exportData: any[] = [];
    
    if (widget['echart_options']?.series?.[0]?.data) {
      const seriesData = widget['echart_options'].series[0].data;
      const xAxisData = widget['echart_options']?.xAxis?.data || [];
      const yAxisData = widget['echart_options']?.yAxis?.data || [];
      
      seriesData.forEach((item: any) => {
        if (item && item.value) {
          const [x, y, value] = item.value;
          exportData.push({
            X: xAxisData[x] || x,
            Y: yAxisData[y] || y,
            Value: value,
            Name: item.name || `${x}-${y}`
          });
        }
      });
    }
    
    return exportData;
  }

  /**
   * Get export headers for Excel/CSV export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['X', 'Y', 'Value', 'Name'];
  }

  /**
   * Get export sheet name for Excel export
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Heatmap Chart Data';
  }
}

// Legacy function for backward compatibility
export function createHeatmapChartWidget(data?: HeatmapChartData[], xAxisData?: string[], yAxisData?: string[]): WidgetBuilder {
  return HeatmapChartBuilder.createHeatmapChartWidget(data, xAxisData, yAxisData);
} 