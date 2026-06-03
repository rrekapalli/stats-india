import { IWidget } from '../../entities/IWidget';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette, FilterBy } from '../d3-chart-builder';

/**
 * Interface for individual stock data item
 */
export interface StockListData {
  /** Stable id for row identity (e.g. Kite instrument token string). */
  id?: string;
  symbol: string;
  /** Kite / API tradingsymbol when distinct from display symbol (indices, instruments). */
  tradingsymbol?: string;
  /** Kite instrument token (for live tick merge when using filtered API). */
  instrumentToken?: string;
  companyName?: string;
  lastPrice: number;
  priceChange: number;
  percentChange: number;
  volume?: number;
  dayHigh?: number;
  dayLow?: number;
  openPrice?: number;
  previousClose?: number;
  industry?: string;
  sector?: string;
}

/**
 * Interface for dataset source configuration
 */
export interface DatasetSource {
  source: any[];
}

/**
 * Interface for encode mapping configuration
 */
export interface EncodeMapping {
  x?: string | string[];
  y?: string | string[];
  tooltip?: string | string[];
  itemName?: string;
  value?: string | string[];
}

/**
 * Interface for stock list chart series options
 */
export interface StockListChartSeriesOptions {
  type?: 'table' | 'bar' | 'line';
  name?: string;
  data?: any[];
  encode?: EncodeMapping;
  itemStyle?: {
    color?: string | ((params: any) => string);
    borderRadius?: number | number[];
  };
  label?: {
    show?: boolean;
    position?: string;
    formatter?: string | ((params: any) => string);
  };
  emphasis?: {
    focus?: string;
    itemStyle?: {
      color?: string;
    };
  };
  tooltip?: {
    formatter?: string | ((params: any) => string);
  };
}

/**
 * Interface for stock list chart options
 */
export interface StockListChartOptions {
  title?: {
    text?: string;
    subtext?: string;
  };
  tooltip?: {
    trigger?: string;
    formatter?: string | ((params: any) => string);
  };
  legend?: {
    data?: string[];
  };
  grid?: {
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
    top?: string | number;
    containLabel?: boolean;
  };
  xAxis?: any;
  yAxis?: any;
  series?: StockListChartSeriesOptions[];
  dataset?: DatasetSource;
  visualMap?: any;
  color?: string[];
}

/**
 * Stock List Chart Builder for displaying stock ticks data in a table format
 * Similar to indices.component.ts but as a chart builder
 */
export class D3StockListChartBuilder extends D3ChartBuilder<StockListChartOptions> {
  private categories: string[] = [];
  private datasetSource: any[] = [];
  private encode: EncodeMapping = {};
  private colors: string[] = [];
  private barWidth: string | number = 'auto';
  private barBorderRadius: number | number[] = 0;
  private currencyFormatter: { currency: string; locale: string } | null = null;
  private percentageFormatter: { decimals: number } | null = null;
  private customNumberFormatter: { decimals: number; locale: string } | null = null;
  private filterColumn: string | null = null;

  /**
   * Constructor for D3StockListChartBuilder
   */
  constructor() {
    super();
  }

  /**
   * Create a new instance of D3StockListChartBuilder
   */
  static create(): D3StockListChartBuilder {
    return new D3StockListChartBuilder();
  }

  /**
   * Get default chart options
   */
  protected override getDefaultOptions(): any {
    return {
      title: {
        text: 'Stock List',
        subtext: 'Stock Ticks Data'
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data;
          if (data && typeof data === 'object') {
            return `
              <strong>${data.symbol}</strong><br/>
              Company: ${data.companyName || 'N/A'}<br/>
              Price: ₹${data.lastPrice?.toFixed(2) || '0.00'}<br/>
              Change: ₹${data.priceChange?.toFixed(2) || '0.00'} (${data.percentChange?.toFixed(2) || '0.00'}%)<br/>
              Volume: ${data.volume?.toLocaleString() || 'N/A'}<br/>
              High: ₹${data.dayHigh?.toFixed(2) || 'N/A'}<br/>
              Low: ₹${data.dayLow?.toFixed(2) || 'N/A'}
            `;
          }
          return '';
        }
      },
      legend: {
        data: ['Stocks']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        name: 'Stock Symbol',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: 'Price (₹)',
        nameLocation: 'middle',
        nameGap: 50
      },
      series: [],
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
    };
  }

  /**
   * Get chart type
   */
  protected getChartType(): string {
    return 'stock-list';
  }

  /**
   * Get default series options
   */
  protected getDefaultSeriesOptions(): StockListChartSeriesOptions {
    return {
      type: 'bar',
      name: 'Stock Price',
      itemStyle: {
        borderRadius: this.barBorderRadius,
        color: (params: any) => {
          const data = params.data;
          if (data && typeof data === 'object' && data.percentChange !== undefined) {
            return data.percentChange >= 0 ? '#26a69a' : '#ef5350';
          }
          return '#5470c6';
        }
      },
      label: {
        show: false,
        position: 'right',
        formatter: (params: any) => {
          const data = params.data;
          if (data && typeof data === 'object') {
            return `₹${data.lastPrice?.toFixed(2) || '0.00'}`;
          }
          return '';
        }
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          color: '#3f51b5'
        }
      }
    };
  }

  /**
   * Transform stock data for chart consumption
   */
  protected transformData(options?: ChartDataTransformOptions): any[] {
    if (!this.data || !Array.isArray(this.data)) {
      return [];
    }

    let transformedData = [...this.data];

    // Sort data if specified
    if (options?.sortBy) {
      transformedData.sort((a, b) => {
        const aValue = a[options.sortBy! as keyof StockListData];
        const bValue = b[options.sortBy! as keyof StockListData];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return options.sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        }
        
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        return options.sortOrder === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      });
    }

    // Limit data if specified
    if (options?.limit && options.limit > 0) {
      transformedData = transformedData.slice(0, options.limit);
    }

    return transformedData.map(item => ({
      ...item,
      name: item.symbol,
      value: item.lastPrice
    }));
  }


  /**
   * Auto-extract categories from stock data
   */
  private autoExtractCategories(data: StockListData[]): void {
    if (!data || data.length === 0) return;
    
    this.categories = data.map(item => item.symbol).filter(Boolean);
  }

  /**
   * Set categories manually
   */
  setCategories(categories: string[]): D3StockListChartBuilder {
    this.categories = categories;
    return this;
  }

  /**
   * Set dataset source for advanced data binding
   */
  setDatasetSource(source: any[]): D3StockListChartBuilder {
    this.datasetSource = source;
    return this;
  }

  /**
   * Set encode mapping for dataset
   */
  setEncode(encode: EncodeMapping): D3StockListChartBuilder {
    this.encode = encode;
    return this;
  }

  /**
   * Set visual map configuration
   */
  setVisualMap(config: any): D3StockListChartBuilder {
    (this.chartOptions as any).visualMap = config;
    return this;
  }

  /**
   * Set custom colors
   */
  override setColors(colors: string[]): this {
    this.colors = colors;
    (this.chartOptions as any).color = colors;
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const paletteColors = this.getPaletteColors(palette);
    return this.setColors(paletteColors);
  }

  /**
   * Set bar width
   */
  setBarWidth(width: string | number): D3StockListChartBuilder {
    this.barWidth = width;
    return this;
  }

  /**
   * Set bar border radius
   */
  setBarBorderRadius(radius: number | number[]): D3StockListChartBuilder {
    this.barBorderRadius = radius;
    return this;
  }

  /**
   * Set X-axis name
   */
  setXAxisName(name: string): D3StockListChartBuilder {
    if (!(this.chartOptions as any).xAxis) {
      (this.chartOptions as any).xAxis = {};
    }
    (this.chartOptions as any).xAxis.name = name;
    return this;
  }

  /**
   * Set Y-axis name
   */
  setYAxisName(name: string): D3StockListChartBuilder {
    if (!(this.chartOptions as any).yAxis) {
      (this.chartOptions as any).yAxis = {};
    }
    (this.chartOptions as any).yAxis.name = name;
    return this;
  }

  /**
   * Set currency formatter
   */
  override setCurrencyFormatter(currency: string = 'INR', locale: string = 'en-IN'): this {
    this.currencyFormatter = { currency, locale };
    return this;
  }

  /**
   * Set percentage formatter
   */
  override setPercentageFormatter(decimals: number = 2): this {
    this.percentageFormatter = { decimals };
    return this;
  }

  /**
   * Set custom number formatter
   */
  setCustomNumberFormatter(decimals: number = 2, locale: string = 'en-IN'): D3StockListChartBuilder {
    this.customNumberFormatter = { decimals, locale };
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
  createFilterFromChartData(): DataFilter[] {
    if (!this.data || this.data.length === 0) return [];
    
    const uniqueValues = [...new Set(this.data.map(item => item.symbol))];
    return [{
      column: 'symbol',
      operator: 'in',
      value: uniqueValues
    }];
  }

  /**
   * Generate sample stock data for testing
   */
  generateSampleData(count: number = 10): StockListData[] {
    const sampleStocks = ['RELIANCE', 'TCS', 'INFY', 'HDFC', 'ICICI', 'SBI', 'WIPRO', 'ONGC', 'ITC', 'BHARTI'];
    
    return Array.from({ length: count }, (_, i) => ({
      symbol: sampleStocks[i % sampleStocks.length] + (i >= sampleStocks.length ? (Math.floor(i / sampleStocks.length) + 1) : ''),
      companyName: `Company ${i + 1}`,
      lastPrice: Math.random() * 3000 + 100,
      priceChange: (Math.random() - 0.5) * 100,
      percentChange: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 1000000),
      dayHigh: Math.random() * 3100 + 100,
      dayLow: Math.random() * 2900 + 100,
      openPrice: Math.random() * 3000 + 100,
      previousClose: Math.random() * 3000 + 100,
      industry: 'Technology',
      sector: 'IT'
    }));
  }

  /**
   * Set configuration for stock performance display
   */
  setStockPerformanceConfiguration(): D3StockListChartBuilder {
    this.setXAxisName('Stock Symbol');
    this.setYAxisName('Price (INR)');
    this.setCurrencyFormatter('INR', 'en-IN');
    return this;
  }

  /**
   * Set configuration for stock comparison
   */
  setStockComparisonConfiguration(): D3StockListChartBuilder {
    this.setXAxisName('Stocks');
    this.setYAxisName('Performance (%)');
    this.setPercentageFormatter(2);
    return this;
  }

  /**
   * Set configuration for volume analysis
   */
  setVolumeAnalysisConfiguration(): D3StockListChartBuilder {
    this.setXAxisName('Stock Symbol');
    this.setYAxisName('Volume');
    this.setCustomNumberFormatter(0, 'en-IN');
    return this;
  }

  /**
   * Set dataset encode configuration for advanced data binding
   */
  setDatasetEncodeConfiguration(): D3StockListChartBuilder {
    this.setDatasetSource(this.data || []);
    this.setEncode({
      x: 'symbol',
      y: 'lastPrice',
      tooltip: ['symbol', 'lastPrice', 'percentChange'],
      itemName: 'symbol',
      value: 'lastPrice'
    });

    // Update series to use dataset
    const seriesOptions = this.getDefaultSeriesOptions();
    seriesOptions.encode = this.encode;
    seriesOptions.tooltip = {
      formatter: (params: any) => {
        const data = params.data;
        return `${data.symbol}: ₹${data.lastPrice?.toFixed(2)} (${data.percentChange?.toFixed(2)}%)`;
      }
    };

    (this.chartOptions as any).series = [seriesOptions];
    (this.chartOptions as any).dataset = { source: this.datasetSource };

    return this;
  }

  /**
   * Override setData to handle StockDataDto[] input
   */
  override setData(data: any): this {
    // Store the raw data for transformation later
    this.data = data;
    this.widgetBuilder.setData(data);
    return this;
  }

  /**
   * Transform any data format to StockListData format
   */
  private transformToStockListData(data: any[]): StockListData[] {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      symbol: item.symbol || '',
      companyName: item.companyName || '',
      lastPrice: item.lastPrice || 0,
      priceChange: item.priceChange || 0,
      percentChange: item.percentChange || 0,
      volume: item.totalTradedVolume || item.volume || 0,
      dayHigh: item.dayHigh || 0,
      dayLow: item.dayLow || 0,
      openPrice: item.openPrice || 0,
      previousClose: item.previousClose || 0,
      industry: item.industry || item.basicIndustry || '',
      sector: item.sector || ''
    }));
  }

  /**
   * Build the final chart configuration
   */
  override build(): IWidget {
    return super.build();
  }

  /**
   * Update widget data dynamically
   */
  updateData(widget: IWidget, data: StockListData[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const updateWithRetry = (attempt: number = 0) => {
        try {
          const transformedData = data.map(item => ({
            ...item,
            name: item.symbol,
            value: item.lastPrice
          }));

          const categories = data.map(item => item.symbol);

          if (widget.chart && widget.chart.setOption) {
            widget.chart.setOption({
              xAxis: {
                data: categories
              },
              series: [{
                data: transformedData
              }]
            });
            resolve();
          } else if (attempt < 3) {
            setTimeout(() => updateWithRetry(attempt + 1), 100);
          } else {
            reject(new Error('Chart instance not available after retries'));
          }
        } catch (error) {
          if (attempt < 3) {
            setTimeout(() => updateWithRetry(attempt + 1), 100);
          } else {
            reject(error);
          }
        }
      };

      updateWithRetry();
    });
  }

  /**
   * Type guard to check if widget is a stock list chart
   */
  static isStockListChart(widget: IWidget): boolean {
    return widget.type === 'stock-list' || widget.chartType === 'stock-list';
  }

  /**
   * Export chart data to array format
   */
  exportData(widget: IWidget): any[] {
    if (!this.data || this.data.length === 0) {
      return [];
    }

    return this.data.map(item => ({
      'Symbol': item.symbol,
      'Company Name': item.companyName || '',
      'Last Price': item.lastPrice,
      'Price Change': item.priceChange,
      'Percent Change': item.percentChange,
      'Volume': item.volume || 0,
      'Day High': item.dayHigh || 0,
      'Day Low': item.dayLow || 0,
      'Open Price': item.openPrice || 0,
      'Previous Close': item.previousClose || 0,
      'Industry': item.industry || '',
      'Sector': item.sector || ''
    }));
  }

  /**
   * Get export headers for the chart data
   */
  getExportHeaders(widget: IWidget): string[] {
    return ['Symbol', 'Company Name', 'Last Price', 'Price Change', 'Percent Change', 'Volume', 'Day High', 'Day Low', 'Open Price', 'Previous Close', 'Industry', 'Sector'];
  }

  /**
   * Get export sheet name
   */
  getExportSheetName(widget: IWidget): string {
    return widget.title || 'Stock List Data';
  }
}