// Import dashboard modules and chart builders
import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette, ChartFilterEvent } from '../apache-echart-builder';
import { getMoneytreeChartUiColors, getMoneytreeDataZoomSliderStyle } from '../../theme/chart-ui-colors';

export interface CandlestickChartData {
  date: string;
  open: number;
  close: number;
  low: number;
  high: number;
  volume?: number;
  [key: string]: any;
}

export interface VolumeSeriesOptions {
  name?: string;
  type?: string;
  data?: number[][];
  xAxisIndex?: number;
  yAxisIndex?: number;
  itemStyle?: {
    color?: string;
    color0?: string;
    opacity?: number;
  };
}

export interface CandlestickSeriesOptions {
  name?: string;
  type?: string;
  data?: number[][];
  itemStyle?: {
    color?: string;
    color0?: string;
    borderColor?: string;
    borderColor0?: string;
    borderWidth?: number;
    barWidth?: string; // Added for bar width
  };
}

export interface CandlestickChartOptions {
  tooltip?: any;
  xAxis?: {
    type?: string;
    data?: string[];
    name?: string;
    boundaryGap?: boolean;
    axisLine?: any;
    splitLine?: any;
    min?: string | number;
    max?: string | number;
    gridIndex?: number;
    axisLabel?: any;
  }[];
  yAxis?: {
    type?: string;
    name?: string;
    scale?: boolean;
    splitArea?: any;
    splitNumber?: number;
    axisLabel?: any;
    axisLine?: any;
    axisTick?: any;
    splitLine?: any;
    gridIndex?: number;
  }[];
  series?: (CandlestickSeriesOptions | VolumeSeriesOptions)[];
  grid?: any[];
  dataZoom?: any[];
  legend?: {
    data?: string[];
    top?: string | number;
    left?: string | number;
  };
  // Add time range filter options
  timeRangeFilters?: {
    selectedRange: string;
    ranges: string[];
  };
  [key: string]: any;
}

// Time range filter options
export type TimeRange = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'MAX';

// Custom event interface for time range filter changes
export interface TimeRangeFilterEvent {
  type: 'timeRangeChange';
  range: TimeRange;
  widgetId: string;
}

/**
 * Enhanced Candlestick Chart Builder
 * 
 * Features:
 * - Generic data transformation from any[] to candlestick format
 * - Advanced formatting (currency, percentage, number)
 * - Predefined color palettes
 * - Filter integration
 * - Sample data generation
 * - Configuration presets for financial analysis
 * - Enhanced update methods with retry mechanism
 * - Time range filters (1D, 5D, 1M, 3M, 6M, 1Y, 3Y, 5Y, MAX)
 * - Area series overlay with close price data
 * - Custom event system for time range filter changes
 */
export class CandlestickChartBuilder extends ApacheEchartBuilder<CandlestickChartOptions, CandlestickSeriesOptions> {
  private volumeSeriesOptions: VolumeSeriesOptions;
  private xAxisData: string[] = [];
  private filterColumn: string = '';
  private timeRangeFilters: TimeRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'];
  private selectedTimeRange: TimeRange = '1Y'; // Default to Y
  private showAreaSeries: boolean = true;
  private areaSeriesOpacity: number = 0.3;
  private showVolume: boolean = true;
  private showLegend: boolean = true;
  private showDataZoom: boolean = true;
  private timeRangeChangeCallback?: (event: TimeRangeFilterEvent) => void;
  private graphicElements: any[] = []; // Store graphic elements for click handling

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
    this.volumeSeriesOptions = this.getDefaultVolumeSeriesOptions();
  }

  /**
   * Create a new CandlestickChartBuilder instance
   */
  static create(): CandlestickChartBuilder {
    return new CandlestickChartBuilder();
  }

  /**
   * Get default chart options
   */
  protected override getDefaultOptions(): any {
    const chartBg = getMoneytreeChartUiColors().chartSurface;
    return {
      backgroundColor: chartBg,
              grid: [
          {
            left: '10%',
            right: '10%',
            top: '10%',
            height: '60%'
          },
          {
            left: '10%',
            right: '10%',
            top: '70%',
            height: '12%'
          }
        ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params: any) => {
          if (Array.isArray(params)) {
            let result = `${params[0].name}<br/>`;
            params.forEach(param => {
              if (param.seriesName === 'Candlestick') {
                const data = param.data;
                result += `Open: ${data[1]}<br/>Close: ${data[2]}<br/>Low: ${data[3]}<br/>High: ${data[4]}<br/>`;
              } else if (param.seriesName === 'Volume') {
                result += `Volume: ${param.data[1]}<br/>`;
              }
            });
            return result;
          } else {
            const param = params;
            const data = param.data;
            return `${param.name}<br/>
                    Open: ${data[1]}<br/>
                    Close: ${data[2]}<br/>
                    Low: ${data[3]}<br/>
                    High: ${data[4]}`;
          }
        }
      },
      xAxis: [
        {
          type: 'category',
          data: [],
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        },
        {
          type: 'category',
          gridIndex: 1,
          data: [],
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitLine: { show: false },
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
              dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0, 1],
            start: 0,
            end: 100
          },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: 'slider',
            start: 0,
            end: 100,
            bottom: 8,
            height: 22,
            ...getMoneytreeDataZoomSliderStyle(),
          }
        ],
      legend: {
        data: ['Candlestick', 'Volume'],
        top: '5%',
        left: 'center'
      }
    };
  }

  /**
   * Get chart type
   */
  protected override getChartType(): string {
    return 'candlestick';
  }

  /**
   * Get default series options
   */
  private getDefaultSeriesOptions(): CandlestickSeriesOptions {
    return {
      name: 'Candlestick',
      type: 'candlestick',
      data: [],
      itemStyle: {
        color: '#00da3c',        // green for positive (close > open)
        color0: '#ec0000',       // red for negative (close < open)
        borderColor: '#008F28',  // green border for positive
        borderColor0: '#8A0000', // red border for negative
        borderWidth: 1,
      },
    };
  }

  /**
   * Get default volume series options
   */
  private getDefaultVolumeSeriesOptions(): VolumeSeriesOptions {
    return {
      name: 'Volume',
      type: 'bar',
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: [],
      itemStyle: {
        color: '#7fbe9e',
        color0: '#d87a80',
        opacity: 0.8
      }
    };
  }

  /**
   * Transform generic data to candlestick format
   */
  transformData(options: { 
    dateField?: string; 
    openField?: string; 
    closeField?: string; 
    lowField?: string; 
    highField?: string; 
    volumeField?: string;
  } & ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      dateField = 'date',
      openField = 'open',
      closeField = 'close',
      lowField = 'low',
      highField = 'high',
      volumeField = 'volume',
      sortBy,
      sortOrder = 'asc',
      limit
    } = options;

    try {
      let transformedData: number[][] = [];
      let volumeData: number[][] = [];
      let xAxisLabels: string[] = [];

      // Apply filters first
      let filteredData = this.data;
      if ((options as any).filters && (options as any).filters.length > 0) {
        filteredData = ApacheEchartBuilder.applyFilters(this.data, (options as any).filters);
      }

      // Transform data to candlestick format [open, close, low, high] and volume format [date, volume]
      filteredData.forEach(item => {
        const date = item[dateField];
        const open = parseFloat(item[openField]) || 0;
        const close = parseFloat(item[closeField]) || 0;
        const low = parseFloat(item[lowField]) || 0;
        const high = parseFloat(item[highField]) || 0;
        const volume = parseFloat(item[volumeField]) || 0;

        xAxisLabels.push(date);
        transformedData.push([open, close, low, high]);
        volumeData.push([date, volume]);
      });

      // Apply sorting
      if (sortBy === 'date') {
        const combined = xAxisLabels.map((label, index) => ({ 
          label, 
          candlestickData: transformedData[index],
          volumeData: volumeData[index]
        }));
        combined.sort((a, b) => {
          const dateA = new Date(a.label).getTime();
          const dateB = new Date(b.label).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        xAxisLabels = combined.map(item => item.label);
        transformedData = combined.map(item => item.candlestickData);
        volumeData = combined.map(item => item.volumeData);
      }

      // Apply limit
      if (limit && limit > 0) {
        xAxisLabels = xAxisLabels.slice(0, limit);
        transformedData = transformedData.slice(0, limit);
        volumeData = volumeData.slice(0, limit);
      }

      this.seriesOptions.data = transformedData;
      this.volumeSeriesOptions.data = volumeData;
      this.setXAxisData(xAxisLabels);

    } catch (error) {
      console.error('Error transforming candlestick chart data:', error);
    }

    return this;
  }

  /**
   * Set the data for the candlestick chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data;
    super.setData(data);
    return this;
  }

  /**
   * Set X-axis data (categories/dates)
   */
  setXAxisData(data: string[]): this {
    this.xAxisData = data;
    if ((this.chartOptions as any).xAxis && Array.isArray((this.chartOptions as any).xAxis)) {
      (this.chartOptions as any).xAxis[0].data = data;
      (this.chartOptions as any).xAxis[1].data = data;
    } else {
      (this.chartOptions as any).xAxis = {
        ...(this.chartOptions as any).xAxis,
        data: data,
      };
    }
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
    if ((this.chartOptions as any).yAxis && Array.isArray((this.chartOptions as any).yAxis)) {
      (this.chartOptions as any).yAxis[0].name = name;
    } else {
      (this.chartOptions as any).yAxis = {
        ...(this.chartOptions as any).yAxis,
        name,
      };
    }
    return this;
  }

  /**
   * Enable or disable volume bars
   * @param enabled Whether to show volume bars (default: true)
   */
  enableVolume(enabled: boolean = true): this {
    this.showVolume = enabled;
    return this;
  }

  /**
   * Enable or disable legend
   * @param enabled Whether to show legend (default: true)
   */
  enableLegend(enabled: boolean = true): this {
    this.showLegend = enabled;
    return this;
  }

  /**
   * Enable or disable data zoom
   * @param enabled Whether to show data zoom controls (default: true)
   */
  enableDataZoom(enabled: boolean = true): this {
    this.showDataZoom = enabled;
    return this;
  }



  /**
   * Set candlestick colors based on price movement
   * @param upColor Color for positive movement (close > open) - default green
   * @param downColor Color for negative movement (close < open) - default red
   * @param neutralColor Color for no movement (close = open) - default grey
   */
  setCandlestickColors(upColor: string = '#00da3c', downColor: string = '#ec0000', neutralColor: string = '#808080'): this {
    if (this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle.color = upColor;
      this.seriesOptions.itemStyle.color0 = downColor;
      this.seriesOptions.itemStyle.borderColor = upColor;
      this.seriesOptions.itemStyle.borderColor0 = downColor;
    } else {
      this.seriesOptions.itemStyle = {
        color: upColor,
        color0: downColor,
        borderColor: upColor,
        borderColor0: downColor,
        borderWidth: 1
      };
    }
    return this;
  }

  /**
   * Set the width of candlestick bars
   * @param width Bar width as percentage (e.g., '60%') or pixel value
   */
  setBarWidth(width: string): this {
    if (this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle.barWidth = width;
    } else {
      this.seriesOptions.itemStyle = { barWidth: width };
    }
    return this;
  }

  /**
   * Enable time range filters above the chart
   * @param ranges Array of time ranges to show (default: all standard ranges)
   * @param defaultRange Default selected range (default: '1Y')
   */
  enableTimeRangeFilters(ranges: TimeRange[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'MAX'], defaultRange: TimeRange = '1Y'): this {
    this.timeRangeFilters = ranges;
    this.selectedTimeRange = defaultRange;
    
    // Add time range filter configuration to chart options
    (this.chartOptions as any).timeRangeFilters = {
      selectedRange: this.selectedTimeRange,
      ranges: this.timeRangeFilters
    };
    
    return this;
  }

  /**
   * Disable time range filters
   */
  disableTimeRangeFilters(): this {
    this.timeRangeFilters = [];
    delete (this.chartOptions as any).timeRangeFilters;
    this.graphicElements = [];
    this.timeRangeChangeCallback = undefined;
    return this;
  }

  /**
   * Set the selected time range
   * @param range The time range to select
   */
  setSelectedTimeRange(range: TimeRange): this {
    this.selectedTimeRange = range;
    if ((this.chartOptions as any).timeRangeFilters) {
      (this.chartOptions as any).timeRangeFilters.selectedRange = range;
    }
    return this;
  }

  /**
   * Set callback for time range filter changes
   * @param callback Function to handle time range filter changes
   */
  setTimeRangeChangeCallback(callback: (event: TimeRangeFilterEvent) => void): this {
    // Store the callback directly
    this.timeRangeChangeCallback = callback;
    
    // Also use the generalized filter change callback
    this.setFilterChangeCallback((event: ChartFilterEvent) => {
      if (event.type === 'customFilter' && event.filterType === 'timeRange') {
        const timeRangeEvent: TimeRangeFilterEvent = {
          type: 'timeRangeChange',
          range: event.value as TimeRange,
          widgetId: event.widgetId
        };
        callback(timeRangeEvent);
      }
    });
    
    // Set up the event handler
    this.setEvents((widget, chart) => {
      if (chart) {
        // Set up event handling for time range filters
        chart.off('click');
        chart.on('click', (params: any) => {
          // Check if the click is on a graphic element (time range filter)
          if (params.componentType === 'graphic') {
            
            // Get the graphic element from the chart options
            const chartOptions = chart.getOption();
            
            // Try different ways to access graphic elements
            let graphicElements: any[] = [];
            if (chartOptions.graphic) {
              graphicElements = Array.isArray(chartOptions.graphic) ? chartOptions.graphic : [chartOptions.graphic];
            } else if (chartOptions.elements && chartOptions.elements.graphic) {
              graphicElements = Array.isArray(chartOptions.elements.graphic) ? chartOptions.elements.graphic : [chartOptions.elements.graphic];
            } else if (Array.isArray(chartOptions)) {
              // If chartOptions is an array, look for graphic in each element
              for (const option of chartOptions) {
                if (option.graphic) {
                  graphicElements = Array.isArray(option.graphic) ? option.graphic : [option.graphic];
                  break;
                }
              }
            }
            
            let clickedElement = graphicElements[params.componentIndex];
            
            // Fallback: use stored graphic elements if chart options don't work
            if (!clickedElement || (!clickedElement.range && !clickedElement.filterValue)) {
              clickedElement = this.graphicElements[params.componentIndex];
            }
            
            if (clickedElement && (clickedElement.range || clickedElement.filterValue)) {
              const range = clickedElement.range || clickedElement.filterValue;
              
              // Update selected time range
              this.selectedTimeRange = range;
              
              // Trigger filter change event
              if (this.filterChangeCallback) {
                this.filterChangeCallback({
                  type: 'customFilter',
                  filterType: 'timeRange',
                  value: range,
                  widgetId: widget.id
                });
              } else {
                console.warn('🔥 No filter change callback available!');
              }
              
              if (this.timeRangeChangeCallback) {
                this.timeRangeChangeCallback({
                  type: 'timeRangeChange',
                  range: range,
                  widgetId: widget.id
                });
              } else {
                console.warn('🔥 No time range change callback set!');
              }
              
              // Also trigger global function as fallback
              if (typeof window !== 'undefined' && (window as any).handleTimeRangeFilterClick) {
                (window as any).handleTimeRangeFilterClick(range);
              }
              
              return false; // Prevent default behavior
            }
          }
          
          return true; // Allow default behavior for non-filter clicks
        });
      }
    });
    
    return this;
  }

  /**
   * Enable area series overlay with close price data
   * @param enabled Whether to show the area series (default: true)
   * @param opacity Opacity of the area series (default: 0.3)
   */
  enableAreaSeries(enabled: boolean = true, opacity: number = 0.3): this {
    this.showAreaSeries = enabled;
    this.areaSeriesOpacity = opacity;
    return this;
  }

  /**
   * Set area series opacity
   * @param opacity Opacity value between 0 and 1
   */
  setAreaSeriesOpacity(opacity: number): this {
    this.areaSeriesOpacity = Math.max(0, Math.min(1, opacity));
    return this;
  }

  /**
   * Enable brush selection for technical analysis
   */
  enableBrush(): this {
    (this.chartOptions as any).brush = {
      xAxisIndex: 0,
      brushLink: 'all',
      outOfBrush: {
        colorAlpha: 0.1
      },
      brushStyle: {
        borderWidth: 1,
        color: 'rgba(120,140,180,0.3)',
        borderColor: 'rgba(120,140,180,0.8)'
      }
    };
    return this;
  }

  /**
   * Enable large data mode for better performance with many data points
   * @param threshold Minimum number of data points to enable large mode
   */
  setLargeMode(threshold: number = 600): this {
    if (this.data && this.data.length >= threshold) {
      (this.chartOptions as any).useUTC = true;
      (this.chartOptions as any).animation = false;
      (this.chartOptions as any).progressive = 500;
      (this.chartOptions as any).progressiveThreshold = 3000;
    }
    return this;
  }

  /**
   * Set tooltip type for better user experience
   * @param type Tooltip type: 'item' for data point, 'axis' for crosshair
   */
  setTooltipType(type: 'item' | 'axis' = 'axis'): this {
    (this.chartOptions as any).tooltip = {
      ...(this.chartOptions as any).tooltip,
      trigger: type
    };
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length >= 2) {
      this.seriesOptions.itemStyle = {
        ...this.seriesOptions.itemStyle,
        color: colors[0],   // up/bull color
        color0: colors[1],  // down/bear color
        borderColor: colors[0],
        borderColor0: colors[1],
      };
    }
    return this;
  }

  /**
   * Set currency formatter for values
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setTooltip('axis', (params: any) => {
      const param = Array.isArray(params) ? params[0] : params;
      const data = param.data;
      return `${param.name}<br/>
              Open: ${formatter(data[1])}<br/>
              Close: ${formatter(data[2])}<br/>
              Low: ${formatter(data[3])}<br/>
              High: ${formatter(data[4])}`;
    });
    return this;
  }

  /**
   * Set percentage formatter for values
   */
  override setPercentageFormatter(decimals: number = 2): this {
    const formatter = this.createPercentageFormatter(decimals);
    this.setTooltip('axis', (params: any) => {
      const param = Array.isArray(params) ? params[0] : params;
      const data = param.data;
      return `${param.name}<br/>
              Open: ${formatter(data[1])}<br/>
              Close: ${formatter(data[2])}<br/>
              Low: ${formatter(data[3])}<br/>
              High: ${formatter(data[4])}`;
    });
    return this;
  }

  /**
   * Set number formatter for values with custom options
   */
  setCustomNumberFormatter(decimals: number = 2, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setTooltip('axis', (params: any) => {
      const param = Array.isArray(params) ? params[0] : params;
      const data = param.data;
      return `${param.name}<br/>
              Open: ${formatter(data[1])}<br/>
              Close: ${formatter(data[2])}<br/>
              Low: ${formatter(data[3])}<br/>
              High: ${formatter(data[4])}`;
    });
    return this;
  }

  /**
   * Set border colors for candlestick chart
   */
  setBorderColors(upBorderColor: string, downBorderColor: string): this {
    if (!this.seriesOptions.itemStyle) {
      this.seriesOptions.itemStyle = {};
    }
    this.seriesOptions.itemStyle.borderColor = upBorderColor;
    this.seriesOptions.itemStyle.borderColor0 = downBorderColor;
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
  generateSampleData(count: number = 30): this {
    const sampleData = [];
    let price = 100;
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (count - i));
      
      const open = price;
      const change = (Math.random() - 0.5) * 10;
      const close = Math.max(0.1, open + change);
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;
      
      sampleData.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
        symbol: 'SAMPLE'
      });
      
      price = close;
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for stock price analysis
   */
  setStockAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('finance')
      .setXAxisName('Date')
      .setYAxisName('Price')
      .setCurrencyFormatter('USD', 'en-US')
      .setTooltip('axis');
  }

  /**
   * Configuration preset for cryptocurrency analysis
   */
  setCryptoAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('modern')
      .setXAxisName('Date')
      .setYAxisName('Price (USD)')
      .setCurrencyFormatter('USD', 'en-US');
  }

  /**
   * Configuration preset for forex analysis
   */
  setForexAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('business')
      .setXAxisName('Date')
      .setYAxisName('Exchange Rate')
      .setCustomNumberFormatter(4, 'en-US');
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    const series: any[] = [{
      ...this.seriesOptions,
      type: 'candlestick',
    }];

    // Add volume series if enabled
    if (this.showVolume) {
      series.push({
        ...this.volumeSeriesOptions,
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: this.volumeSeriesOptions.data || []
      });
    }

    // Add area series if enabled (always create it even with empty data)
    if (this.showAreaSeries) {
      // Extract close prices for area series
      const closePrices = this.seriesOptions.data?.map(candle => candle[1]) || []; // Close is at index 1 in [open, close, low, high]
      
      series.push({
        name: 'Close Price Area',
        type: 'line',
        data: closePrices,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 1,
          color: getMoneytreeChartUiColors().primaryDark
        },
        areaStyle: {
          color: this.getAreaSeriesColor(),
          opacity: this.areaSeriesOpacity
        },
        z: 1, // Ensure area is behind candlesticks
        yAxisIndex: 0, // Use the same y-axis as candlestick
        xAxisIndex: 0  // Use the same x-axis as candlestick
      });
    }

    // If time range filters are enabled, add them as graphic elements to the chart
    if (this.timeRangeFilters.length > 0) {
      const ui = getMoneytreeChartUiColors();
      // Add time range filters as graphic elements positioned in top left corner
      const timeRangeButtons = this.timeRangeFilters.map((range, index) => ({
        type: 'rect',
        left: 10 + (index * 40), // Even more compact spacing to 40px to fit all filters
        top: 10,  // Moved down slightly to ensure visibility
        width: 35, // Even more compact width to fit all filters
        height: 28, // Increased height for better visibility
        style: {
          fill: range === this.selectedTimeRange ? ui.primary : ui.chartSurfaceMuted,
          stroke: range === this.selectedTimeRange ? ui.primaryDark : ui.border,
                      lineWidth: range === this.selectedTimeRange ? 2.5 : 1.5,
            borderRadius: 4,
            shadowBlur: range === this.selectedTimeRange ? 8 : 2,
            shadowColor: range === this.selectedTimeRange ? 'rgba(33, 150, 243, 0.5)' : 'rgba(0, 0, 0, 0.15)',
            shadowOffsetX: range === this.selectedTimeRange ? 0 : 0,
            shadowOffsetY: range === this.selectedTimeRange ? 4 : 1
        },
        // Store the range as a custom property for event handling
        range: range,
        // Add cursor style for better UX
        cursor: 'pointer',
        // Enable click events
        silent: false,
        filterType: 'timeRange',
        filterValue: range
      }));

      // Add text labels for the buttons
      const timeRangeTexts = this.timeRangeFilters.map((range, index) => {
        // Debug logging for "Y" specifically
        if (range === '1Y') {
        }
        return {
          type: 'text',
          left: 10 + (index * 40) + 17.5, // Center text in button with adjusted spacing
          top: 10 + 14, // Center text vertically in the taller button
          style: {
            text: range,
            fill: range === this.selectedTimeRange ? ui.onPrimary : ui.textPrimary,
            fontSize: 10,  // Even smaller font to fit in smaller buttons
            fontWeight: range === this.selectedTimeRange ? 'bold' : '600',
            textAlign: 'center',
            textVerticalAlign: 'middle',
            fontFamily: 'Verdana, Arial, sans-serif', // Use Verdana which has better character support
            textShadow: range === this.selectedTimeRange ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
          },
          // Store the range as a custom property for event handling
          range: range,
          // Add cursor style for better UX
          cursor: 'pointer',
          // Enable click events
          silent: false,
          filterType: 'timeRange',
          filterValue: range
        };
      });

      // Add underline for selected time range filter
      const selectedIndex = this.timeRangeFilters.indexOf(this.selectedTimeRange);
      const underlineElements = selectedIndex >= 0 ? [{
        type: 'rect',
        left: 10 + (selectedIndex * 40) + 5, // Position under the selected button
        top: 10 + 28 + 2, // Position below the button with small gap
        width: 25, // Width of the underline
        height: 2, // Height of the underline
        style: {
          fill: ui.primaryDark,
          borderRadius: 1
        }
      }] : [];

      // Store graphic elements for click handling
      this.graphicElements = [...timeRangeButtons, ...timeRangeTexts, ...underlineElements];
      
      // Add graphics to chart options
      (this.chartOptions as any).graphic = this.graphicElements;
    }

    // Prepare final options with conditional legend and data zoom
    const finalOptions: CandlestickChartOptions = {
      ...this.chartOptions,
      series: series,
    };
    (finalOptions as { backgroundColor?: string }).backgroundColor =
      getMoneytreeChartUiColors().chartSurface;

    // Ensure graphic elements are included in final options
    if (this.graphicElements && this.graphicElements.length > 0) {
      (finalOptions as any).graphic = this.graphicElements;
    }
    
    // CRITICAL FIX: Ensure dual-axis configuration is always present when volume is enabled
    if (this.showVolume) {
      // Ensure we have proper dual-axis configuration with more space for volume
      finalOptions.grid = [
        {
          left: '10%',
          right: '10%',
          top: '10%',
          height: '60%'
        },
        {
          left: '10%',
          right: '10%',
          top: '70%',
          height: '12%'
        }
      ];
      
      finalOptions.xAxis = [
        {
          type: 'category',
          data: this.xAxisData,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        },
        {
          type: 'category',
          gridIndex: 1,
          data: this.xAxisData,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ];
      
      finalOptions.yAxis = [
        {
          scale: true,
          splitLine: { show: false },
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ];
    }

    // Conditionally include legend
    if (!this.showLegend) {
      delete finalOptions.legend;
    } else {
      // Update legend data based on enabled series
      const legendData = ['Candlestick'];
      if (this.showVolume) {
        legendData.push('Volume');
      }
      if (this.showAreaSeries) {
        legendData.push('Close Price Area');
      }
      finalOptions.legend = {
        ...finalOptions.legend,
        data: legendData
      };
    }

    // Conditionally include data zoom
    if (!this.showDataZoom) {
      delete finalOptions.dataZoom;
    } else if (this.showVolume) {
      // Ensure data zoom is configured for dual-axis
      finalOptions.dataZoom = [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 0,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          start: 0,
          end: 100,
          bottom: 8,
          height: 22,
          ...getMoneytreeDataZoomSliderStyle(),
        }
      ];
    }

    // Create the base widget
    const baseWidget = this.widgetBuilder
      .setEChartsOptions(finalOptions)
      .build();
    
    // Set a reasonable height for the candlestick chart (12 rows = 600px)
    baseWidget.height = 600;
    
    // Add time range filters data to the widget for external access
    if (this.timeRangeFilters.length > 0) {
      (baseWidget as any).timeRangeFilters = {
        ranges: this.timeRangeFilters,
        selectedRange: this.selectedTimeRange
      };
    }

    return baseWidget;
  }



  /**
   * Static method to update time range filters in an existing candlestick chart widget
   */
  static updateTimeRangeFilters(widget: IWidget, selectedRange: TimeRange, callback?: (event: TimeRangeFilterEvent) => void): void {
    if (!widget.chartInstance) {
      return;
    }

    try {
      const ui = getMoneytreeChartUiColors();
      const currentOptions = widget.chartInstance.getOption();
      const timeRangeFilters = (widget as any).timeRangeFilters;
      
      if (!timeRangeFilters || !timeRangeFilters.ranges) {
        return;
      }

      // Update the selected range
      (widget as any).timeRangeFilters.selectedRange = selectedRange;

      // Update graphic elements to reflect the new selected range
      const timeRangeButtons = timeRangeFilters.ranges.map((range: TimeRange, index: number) => ({
        type: 'rect',
        left: 10 + (index * 55), // Increased spacing to 55px to accommodate all filters
        top: 5,  // Moved up slightly to ensure visibility
        width: 50, // Increased width to accommodate "1Y" text
        height: 28, // Increased height for better visibility
        style: {
          fill: range === selectedRange ? ui.primaryDark : ui.chartSurfaceMuted,
          stroke: range === selectedRange ? ui.primaryDark : ui.border,
          lineWidth: 1.5,
          borderRadius: 6,
          shadowBlur: range === selectedRange ? 4 : 1,
          shadowColor: range === selectedRange ? 'rgba(21, 101, 192, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          shadowOffsetX: range === selectedRange ? 0 : 0,
          shadowOffsetY: range === selectedRange ? 2 : 1
        },
        // Store the range as a custom property for event handling
        range: range,
        // Add cursor style for better UX
        cursor: 'pointer',
        // Use generalized filter system
        filterType: 'timeRange',
        filterValue: range,
        // Add onclick handler
        onclick: () => {
          if (callback) {
            callback({
              type: 'timeRangeChange',
              range: range,
              widgetId: widget.id
            });
          }
          // Also trigger global function as fallback
          if (typeof window !== 'undefined' && (window as any).handleTimeRangeFilterClick) {
            (window as any).handleTimeRangeFilterClick(range);
          }
        }
      }));

      const timeRangeTexts = timeRangeFilters.ranges.map((range: TimeRange, index: number) => ({
        type: 'text',
        left: 10 + (index * 55) + 25, // Center text in button with adjusted spacing
        top: 5 + 14, // Center text vertically in the taller button
        style: {
          text: range,
          fill: range === selectedRange ? ui.onPrimary : ui.textPrimary,
          fontSize: 11,  // Slightly larger font for better readability
          fontWeight: range === selectedRange ? 'bold' : '600',
          textAlign: 'center',
          textVerticalAlign: 'middle',
          fontFamily: 'Verdana, Arial, sans-serif', // Use Verdana which has better character support
          textShadow: range === selectedRange ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
        },
        // Store the range as a custom property for event handling
        range: range,
        // Add cursor style for better UX
        cursor: 'pointer',
        // Use generalized filter system
        filterType: 'timeRange',
        filterValue: range,
        // Add onclick handler
        onclick: () => {
          if (callback) {
            callback({
              type: 'timeRangeChange',
              range: range,
              widgetId: widget.id
            });
          }
          // Also trigger global function as fallback
          if (typeof window !== 'undefined' && (window as any).handleTimeRangeFilterClick) {
            (window as any).handleTimeRangeFilterClick(range);
          }
        }
      }));

      // Add underline for selected time range filter
      const selectedIndex = timeRangeFilters.ranges.indexOf(selectedRange);
      const underlineElements = selectedIndex >= 0 ? [{
        type: 'rect',
        left: 10 + (selectedIndex * 55) + 5, // Position under the selected button
        top: 5 + 28 + 2, // Position below the button with small gap
        width: 40, // Width of the underline
        height: 2, // Height of the underline
        style: {
          fill: ui.primaryDark,
          borderRadius: 1
        }
      }] : [];

      const newOptions = {
        ...currentOptions,
        graphic: [...timeRangeButtons, ...timeRangeTexts, ...underlineElements]
      };

      widget.chartInstance.setOption(newOptions, true);
    } catch (error) {
      console.error('Error updating time range filters:', error);
    }
  }

  /**
   * Get the current time range filters configuration
   */
  getTimeRangeFiltersConfig(): { selectedRange: TimeRange; ranges: TimeRange[] } {
    return {
      selectedRange: this.selectedTimeRange,
      ranges: this.timeRangeFilters
    };
  }

  /**
   * Get area series color based on current palette
   */
  private getAreaSeriesColor(): string {
    // Use a light version of the current color palette
    if (this.seriesOptions.itemStyle?.color) {
      // Create a lighter version of the current color for the area
      const color = this.seriesOptions.itemStyle.color;
      // Return a light blue color that works well with candlestick charts
      return '#e3f2fd';
    }
    // Default light blue for area series
    return '#e3f2fd';
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
          // Check if chart is properly initialized
          if (!widget.chartInstance.getOption) {
            // Try direct update even without getOption
            if (widget.chartInstance.setOption) {
              try {
                // Create basic options structure
                const basicOptions = {
                  series: [{
                    type: 'candlestick',
                    data: data.map((item: any) => [
                      Number(item.open) || 0,
                      Number(item.close) || 0,
                      Number(item.low) || 0,
                      Number(item.high) || 0
                    ])
                  }],
                  xAxis: [{
                    type: 'category',
                    data: data.map((item: any) => item.date || '')
                  }],
                  yAxis: [{
                    scale: true
                  }]
                };
                
                widget.chartInstance.setOption(basicOptions, true);
                return;
              } catch (error) {
                console.error('❌ Direct setOption update failed:', error);
              }
            }
            
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(updateWithRetry, 100 * retryCount);
              return;
            } else {
              return;
            }
          }
          
          // Transform data if needed
          let transformedData = data;
          let volumeData: number[][] = [];
          let xAxisLabels: string[] = [];
          
          if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            transformedData = data.map(item => [
              Number(item.open) || 0,
              Number(item.close) || 0,
              Number(item.low) || 0,
              Number(item.high) || 0
            ]);
            
            // Extract volume data if available
            if (data[0].volume !== undefined) {
              volumeData = data.map(item => [
                item.date || '',
                Number(item.volume) || 0
              ]);
            }
            
            // Extract x-axis labels
            xAxisLabels = data.map(item => item.date || '');
          }

          const currentOptions = widget.chartInstance.getOption();

          // Validate current options structure
          if (!currentOptions || typeof currentOptions !== 'object') {
            console.error('❌ Invalid chart options structure:', currentOptions);
            return;
          }
          
          // If chart options are completely empty, create a basic structure
          if (!(currentOptions as any)['series'] && !(currentOptions as any)['xAxis'] && !(currentOptions as any)['yAxis']) {
            const basicOptions = {
              series: [{
                name: 'Candlestick',
                type: 'candlestick',
                data: transformedData,
                itemStyle: {
                  color: '#00da3c',
                  color0: '#ec0000',
                  borderColor: '#00da3c',
                  borderColor0: '#ec0000'
                }
              }],
              xAxis: [{
                type: 'category',
                data: xAxisLabels,
                boundaryGap: false,
                axisLine: { onZero: false },
                splitLine: { show: false }
              }],
              yAxis: [{
                scale: true,
                splitArea: { show: true }
              }],
              grid: [{
                left: '10%',
                right: '10%',
                top: '10%',
                height: '60%'
              }]
            };
            
            widget.chartInstance.setOption(basicOptions, true);
            return;
          }
          
          // Extract close prices for area series if it exists
          const closePrices = transformedData.map((candle: number[]) => candle[1]); // Close is at index 1
          
          // Safely get existing series configuration
          const existingSeries = (currentOptions as any).series || [];
          const existingXAxis = (currentOptions as any).xAxis || [];
          const existingYAxis = (currentOptions as any).yAxis || [];
          const existingGrid = (currentOptions as any).grid || [];
          
          // Update series data with safe access
          const newSeries = [];
          
          // Add candlestick series
          if (existingSeries[0]) {
            newSeries.push({
              ...existingSeries[0],
              data: transformedData
            });
          } else {
            // Fallback candlestick series configuration
            newSeries.push({
              name: 'Candlestick',
              type: 'candlestick',
              data: transformedData,
              itemStyle: {
                color: '#00da3c',
                color0: '#ec0000',
                borderColor: '#00da3c',
                borderColor0: '#ec0000'
              }
            });
          }
          
          // Add volume series if it exists and we have volume data
          if (existingSeries[1]?.name === 'Volume' && volumeData.length > 0) {
            newSeries.push({
              ...existingSeries[1],
              data: volumeData,
              xAxisIndex: 1,
              yAxisIndex: 1,
              type: 'bar'
            });
          } else if (volumeData.length > 0) {
            // Fallback volume series configuration
            newSeries.push({
              name: 'Volume',
              type: 'bar',
              data: volumeData,
              xAxisIndex: 1,
              yAxisIndex: 1,
              itemStyle: {
                color: '#7fbe9e'
              }
            });
          }
          
          // Add area series if it exists in current options
          const areaSeriesIndex = existingSeries.findIndex((s: any) => s.name === 'Close Price Area');
          if (areaSeriesIndex >= 0) {
            newSeries.push({
              ...existingSeries[areaSeriesIndex],
              data: closePrices
            });
          }
          
          // Create safe xAxis configuration
          const newXAxis = [
            {
              ...(existingXAxis[0] || {}),
              data: xAxisLabels,
              type: 'category',
              boundaryGap: false,
              axisLine: { onZero: false },
              splitLine: { show: false },
              min: 'dataMin',
              max: 'dataMax'
            },
            {
              ...(existingXAxis[1] || {}),
              data: xAxisLabels,
              gridIndex: 1,
              type: 'category',
              boundaryGap: false,
              axisLine: { onZero: false },
              splitLine: { show: false },
              axisLabel: { show: false },
              min: 'dataMin',
              max: 'dataMax'
            }
          ];
          
          // Create safe yAxis configuration
          const newYAxis = [
            {
              ...(existingYAxis[0] || {}),
              scale: true,
              splitArea: { show: true }
            },
            {
              ...(existingYAxis[1] || {}),
              scale: true,
              gridIndex: 1,
              splitNumber: 2,
              axisLabel: { show: false },
              axisLine: { show: false },
              axisTick: { show: false },
              splitLine: { show: false }
            }
          ];
          
          // Create safe grid configuration
          const newGrid = [
            {
              ...(existingGrid[0] || {}),
              left: '10%',
              right: '10%',
              top: '10%',
              height: '60%'
            },
            {
              ...(existingGrid[1] || {}),
              left: '10%',
              right: '10%',
              top: '70%',
              height: '12%'
            }
          ];
          
          // Ensure we have proper dual-axis configuration
          const newOptions = {
            ...currentOptions,
            series: newSeries,
            xAxis: newXAxis,
            yAxis: newYAxis,
            grid: newGrid,
            backgroundColor: getMoneytreeChartUiColors().chartSurface,
          };

          widget.chartInstance.setOption(newOptions, true);
          
          // Verify the update worked
          const updatedOptions = widget.chartInstance.getOption();

        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      } catch (error) {
        console.error('Error updating candlestick chart data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Static method to check if a widget is a candlestick chart
   */
  static isCandlestickChart(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'candlestick');
  }

  /**
   * Export candlestick chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const exportData: any[] = [];
    
    if (widget['echart_options']?.series?.[0]?.data && widget['echart_options']?.xAxis?.data) {
      const seriesData = widget['echart_options'].series[0].data;
      const xAxisData = widget['echart_options'].xAxis.data;
      
      seriesData.forEach((data: number[], index: number) => {
        exportData.push({
          Date: xAxisData[index] || `Day ${index + 1}`,
          Open: data[0] || 0,
          Close: data[1] || 0,
          Low: data[2] || 0,
          High: data[3] || 0
        });
      });
    }
    
    return exportData;
  }

  /**
   * Get export headers for Excel/CSV export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Date', 'Open', 'Close', 'Low', 'High'];
  }

  /**
   * Get export sheet name for Excel export
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Candlestick Chart Data';
  }

  /**
   * Set chart events
   */
  override setEvents(callback: (widget: IWidget, chart: any) => void): this {
    // Create a wrapper callback that includes immediate data update
    const wrappedCallback = (widget: IWidget, chart: any) => {
      if (chart) {
        widget.chartInstance = chart;
        
        // Only update data if we have valid data
        if (this.data && this.data.length > 0) {
          CandlestickChartBuilder.updateData(widget, this.data);
        }
      }
      
      // Call the original callback if provided
      if (callback) {
        callback(widget, chart);
      }
    };
    
    // Use the base class implementation with wrapped callback
    super.setEvents(wrappedCallback);
    return this;
  }
} 