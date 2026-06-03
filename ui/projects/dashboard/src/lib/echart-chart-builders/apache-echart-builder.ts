import { IWidget } from '../entities/IWidget';
import { WidgetBuilder } from '../widgets/widget/widget-builder';
import { v4 as uuidv4 } from 'uuid';
import { EChartsOption } from 'echarts';
import { getMoneytreeChartUiColors } from '../theme/chart-ui-colors';

/**
 * Abstract base class for Apache ECharts builders
 * Provides common functionality for all chart types
 */
export abstract class ApacheEchartBuilder<T = any, TSeries extends { [key: string]: any } = any> {
  protected widgetBuilder: WidgetBuilder;
  protected chartOptions: any;
  protected seriesOptions!: TSeries;
  protected data: any[] = [];
  protected filterChangeCallback?: (event: ChartFilterEvent) => void;
  protected customFilters: Map<string, any> = new Map();

  protected constructor() {
    this.widgetBuilder = new WidgetBuilder()
      .setId(uuidv4())
      .setComponent('echart');
    
    this.chartOptions = this.getDefaultOptions();
  }

  /**
   * Abstract method to be implemented by subclasses
   * Should return default options for the specific chart type
   */
  protected abstract getDefaultOptions(): any;

  /**
   * Abstract method to be implemented by subclasses
   * Should return the chart type string (e.g., 'pie', 'bar', 'line')
   */
  protected abstract getChartType(): string;

  /**
   * Static method to export chart data for Excel/CSV export
   * Should return an array of data rows
   */
  static exportData(widget: IWidget): any[] {
    throw new Error('exportData must be implemented by subclass');
  }

  /**
   * Static method to get headers for the exported data
   * Should return an array of column headers
   */
  static getExportHeaders(widget: IWidget): string[] {
    throw new Error('getExportHeaders must be implemented by subclass');
  }

  /**
   * Static method to get sheet name for the exported data
   * Should return a string suitable for Excel sheet name
   */
  static getExportSheetName(widget: IWidget): string {
    throw new Error('getExportSheetName must be implemented by subclass');
  }

  /**
   * Set the data for the chart
   */
  setData(data: any): this {
    this.data = Array.isArray(data) ? data : [data];
    this.widgetBuilder.setData(data);
    return this;
  }

  // --- Widget Configuration Methods ---

  /**
   * Set the widget ID
   */
  setId(id: string): this {
    this.widgetBuilder.setId(id);
    return this;
  }

  /**
   * Set widget configuration properties
   * This method handles internal configuration setup
   */
  setConfig(config: any): this {
    const widget = this.widgetBuilder.build();
    widget.config = widget.config || { options: {} };
    Object.assign(widget.config, config);
    return this;
  }

  /**
   * Set whether to skip default filtering for this chart
   * When true, the chart will use custom filtering logic instead of default filtering
   */
  setSkipDefaultFiltering(skip: boolean): this {
    const widget = this.widgetBuilder.build();
    widget.config = widget.config || { options: {} };
    (widget.config as any).skipDefaultFiltering = skip;
    return this;
  }

  // --- Filtering and Event Handling Methods ---

  /**
   * Set callback for filter changes
   * @param callback Function to handle filter change events
   */
  setFilterChangeCallback(callback: (event: ChartFilterEvent) => void): this {
    this.filterChangeCallback = callback;
    return this;
  }

  /**
   * Add a custom filter to the chart
   * @param filterType The type of filter (e.g., 'timeRange', 'category', 'value')
   * @param filterConfig The filter configuration
   */
  addCustomFilter(filterType: string, filterConfig: any): this {
    this.customFilters.set(filterType, filterConfig);
    return this;
  }

  /**
   * Remove a custom filter from the chart
   * @param filterType The type of filter to remove
   */
  removeCustomFilter(filterType: string): this {
    this.customFilters.delete(filterType);
    return this;
  }

  /**
   * Get a custom filter configuration
   * @param filterType The type of filter to get
   */
  getCustomFilter(filterType: string): any {
    return this.customFilters.get(filterType);
  }

  /**
   * Trigger a filter change event
   * @param event The filter change event
   */
  protected triggerFilterChange(event: ChartFilterEvent): void {
    if (this.filterChangeCallback) {
      this.filterChangeCallback(event);
    } else {
      console.warn('Filter change callback not set');
    }

    // Also call global function as fallback
    if (typeof window !== 'undefined' && (window as any).handleChartFilterChange) {
      (window as any).handleChartFilterChange(event);
    }
  }

  /**
   * Create a global function for filter changes if it doesn't exist
   */
  protected createGlobalFilterFunction(): void {
    if (typeof window !== 'undefined' && !(window as any).handleChartFilterChange) {
      (window as any).handleChartFilterChange = (event: ChartFilterEvent) => {
        if (this.filterChangeCallback) {
          this.filterChangeCallback(event);
        }
      };
    }
  }



  // --- Generic Series Option Methods ---

  /**
   * Set the label formatter
   */
  setLabelFormatter(formatter: string | Function): this {
    if (!(this.seriesOptions as any).label) (this.seriesOptions as any).label = {};
    (this.seriesOptions as any).label.formatter = formatter;
    return this;
  }

  /**
   * Set label visibility
   */
  setLabelShow(show: boolean): this {
    if (!(this.seriesOptions as any).label) (this.seriesOptions as any).label = {};
    (this.seriesOptions as any).label.show = show;
    return this;
  }

  /**
   * Set label position
   */
  setLabelPosition(position: string): this {
    if (!(this.seriesOptions as any).label) (this.seriesOptions as any).label = {};
    (this.seriesOptions as any).label.position = position;
    return this;
  }

  /**
   * Set colors for the chart segments/bars/lines
   */
  setColors(colors: string[]): this {
    const chartType = this.getChartType();
    
    if (chartType === 'pie') {
      // For pie charts, set colors directly on the series
      (this.seriesOptions as any).color = colors;
    } else {
      // For other charts (bar, line, etc.), set colors in itemStyle
      if (!(this.seriesOptions as any).itemStyle) (this.seriesOptions as any).itemStyle = {};
      (this.seriesOptions as any).itemStyle.color = colors;
    }
    
    return this;
  }

  /**
   * Set border radius for segments/bars
   */
  setBorderRadius(radius: number): this {
    if (!(this.seriesOptions as any).itemStyle) (this.seriesOptions as any).itemStyle = {};
    (this.seriesOptions as any).itemStyle.borderRadius = radius;
    return this;
  }

  /**
   * Set border color and width
   */
  setBorder(color: string, width: number = 1): this {
    if (!(this.seriesOptions as any).itemStyle) (this.seriesOptions as any).itemStyle = {};
    (this.seriesOptions as any).itemStyle.borderColor = color;
    (this.seriesOptions as any).itemStyle.borderWidth = width;
    return this;
  }

  /**
   * Set emphasis effects
   */
  setEmphasis(shadowBlur: number = 10, shadowOffsetX: number = 0, shadowColor: string = 'rgba(0, 0, 0, 0.5)'): this {
    (this.seriesOptions as any).emphasis = {
      itemStyle: {
        shadowBlur,
        shadowOffsetX,
        shadowColor,
      },
    };
    return this;
  }

  /**
   * Set the title and subtitle
   */
  setTitle(text: string, subtext?: string): this {
    (this.chartOptions as any).title = {
      text,
      subtext,
      left: 'center',
      top: '10',
      textStyle: {
        fontSize: 16,
        color: '#333',
      },
    };
    return this;
  }

  /**
   * Set custom title options
   */
  setTitleOptions(titleOptions: any): this {
    (this.chartOptions as any).title = {
      ...(this.chartOptions as any).title,
      ...titleOptions,
    };
    return this;
  }

  /**
   * Set tooltip configuration
   */
  setTooltip(trigger: string, formatter?: string | Function): this {
    const ui = getMoneytreeChartUiColors();
    (this.chartOptions as any).tooltip = {
      ...(this.chartOptions as any).tooltip,
      trigger,
      formatter: formatter || '{b}: {c}',
      backgroundColor: ui.chartSurface,
      borderColor: ui.border,
      borderWidth: 1,
      textStyle: {
        ...((this.chartOptions as any).tooltip?.textStyle || {}),
        color: ui.textPrimary,
      },
    };
    return this;
  }

  /**
   * Set custom tooltip options
   */
  setTooltipOptions(tooltipOptions: any): this {
    const ui = getMoneytreeChartUiColors();
    (this.chartOptions as any).tooltip = {
      backgroundColor: ui.chartSurface,
      borderColor: ui.border,
      borderWidth: 1,
      textStyle: {
        ...((this.chartOptions as any).tooltip?.textStyle || {}),
        color: ui.textPrimary,
      },
      ...(this.chartOptions as any).tooltip,
      ...tooltipOptions,
    };
    return this;
  }

  /**
   * Set legend configuration
   */
  setLegend(orient: string = 'vertical', position: string = 'left'): this {
    (this.chartOptions as any).legend = {
      show: true,
      orient,
      left: position === 'left' ? 'left' : position === 'right' ? 'right' : 'center',
      top: orient === 'horizontal' ? 'bottom' : 'middle',
      bottom: orient === 'horizontal' ? '10' : undefined,
    };
    return this;
  }

  /**
   * Set custom legend options
   */
  setLegendOptions(legendOptions: any): this {
    (this.chartOptions as any).legend = {
      ...(this.chartOptions as any).legend,
      ...legendOptions,
    };
    return this;
  }

  /**
   * Set legend visibility
   */
  setShowLegend(show: boolean): this {
    if (!(this.chartOptions as any).legend) {
      (this.chartOptions as any).legend = {};
    }
    (this.chartOptions as any).legend.show = show;
    return this;
  }

  /**
   * Set grid configuration
   */
  setGrid(grid: {
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
    height?: string | number;
    width?: string | number;
    containLabel?: boolean;
  }): this {
    (this.chartOptions as any).grid = {
      ...(this.chartOptions as any).grid,
      ...grid,
    };
    return this;
  }

  /**
   * Set x-axis configuration
   */
  setXAxis(xAxis: any): this {
    (this.chartOptions as any).xAxis = xAxis;
    return this;
  }

  /**
   * Set y-axis configuration
   */
  setYAxis(yAxis: any): this {
    (this.chartOptions as any).yAxis = yAxis;
    return this;
  }

  /**
   * Set series configuration
   */
  setSeries(series: any[]): this {
    (this.chartOptions as any).series = series;
    return this;
  }

  /**
   * Add a single series
   */
  addSeries(series: any): this {
    if (!(this.chartOptions as any).series) {
      (this.chartOptions as any).series = [];
    }
    (this.chartOptions as any).series.push(series);
    return this;
  }

  /**
   * Set animation configuration
   */
  setAnimation(animation: boolean | any): this {
    (this.chartOptions as any).animation = animation;
    return this;
  }

  /**
   * Set background color
   */
  setBackgroundColor(color: string): this {
    (this.chartOptions as any).backgroundColor = color;
    return this;
  }

  /**
   * Set widget header
   */
  setHeader(title: string, options?: string[]): this {
    this.widgetBuilder.setHeader(title, options);
    return this;
  }

  /**
   * Set widget position
   */
  setPosition(position: { x: number; y: number; cols: number; rows: number }): this {
    this.widgetBuilder.setPosition(position);
    return this;
  }

  /**
   * Set custom ECharts options (overrides all other settings)
   */
  setCustomOptions(options: T): this {
    this.widgetBuilder.setEChartsOptions(options);
    return this;
  }

  /**
   * Set events configuration
   */
  setEvents(onChartOptions: (widget: IWidget, chart?: any, filters?: any) => void): this {
    this.widgetBuilder.setEvents(onChartOptions);
    return this;
  }

  /**
   * Set click event handler
   * @param handler Function to handle click events
   */
  setClickEvent(handler: (params: any, widget: IWidget, chart: any) => void): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        chart.off('click');
        chart.on('click', (params: any) => {
          handler(params, widget, chart);
        });
      }
    });
    return this;
  }

  /**
   * Set double-click event handler
   * @param handler Function to handle double-click events
   */
  setDoubleClickEvent(handler: (params: any, widget: IWidget, chart: any) => void): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        chart.off('dblclick');
        chart.on('dblclick', (params: any) => {
          handler(params, widget, chart);
        });
      }
    });
    return this;
  }

  /**
   * Set mouse down event handler
   * @param handler Function to handle mouse down events
   */
  setMouseDownEvent(handler: (params: any, widget: IWidget, chart: any) => void): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        chart.off('mousedown');
        chart.on('mousedown', (params: any) => {
          handler(params, widget, chart);
        });
      }
    });
    return this;
  }

  /**
   * Set mouse up event handler
   * @param handler Function to handle mouse up events
   */
  setMouseUpEvent(handler: (params: any, widget: IWidget, chart: any) => void): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        chart.off('mouseup');
        chart.on('mouseup', (params: any) => {
          handler(params, widget, chart);
        });
      }
    });
    return this;
  }

  /**
   * Set mouse over event handler
   * @param handler Function to handle mouse over events
   */
  setMouseOverEvent(handler: (params: any, widget: IWidget, chart: any) => void): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        chart.off('mouseover');
        chart.on('mouseover', (params: any) => {
          handler(params, widget, chart);
        });
      }
    });
    return this;
  }

  /**
   * Set mouse out event handler
   * @param handler Function to handle mouse out events
   */
  setMouseOutEvent(handler: (params: any, widget: IWidget, chart: any) => void): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        chart.off('mouseout');
        chart.on('mouseout', (params: any) => {
          handler(params, widget, chart);
        });
      }
    });
    return this;
  }

  /**
   * Set multiple event handlers at once
   * @param events Object containing event handlers
   */
  setMultipleEvents(events: {
    click?: (params: any, widget: IWidget, chart: any) => void;
    dblclick?: (params: any, widget: IWidget, chart: any) => void;
    mousedown?: (params: any, widget: IWidget, chart: any) => void;
    mouseup?: (params: any, widget: IWidget, chart: any) => void;
    mouseover?: (params: any, widget: IWidget, chart: any) => void;
    mouseout?: (params: any, widget: IWidget, chart: any) => void;
  }): this {
    this.widgetBuilder.setEvents((widget, chart) => {
      if (chart) {
        // Remove all existing event listeners
        chart.off('click');
        chart.off('dblclick');
        chart.off('mousedown');
        chart.off('mouseup');
        chart.off('mouseover');
        chart.off('mouseout');

        // Add new event listeners
        if (events.click) {
          chart.on('click', (params: any) => events.click!(params, widget, chart));
        }
        if (events.dblclick) {
          chart.on('dblclick', (params: any) => events.dblclick!(params, widget, chart));
        }
        if (events.mousedown) {
          chart.on('mousedown', (params: any) => events.mousedown!(params, widget, chart));
        }
        if (events.mouseup) {
          chart.on('mouseup', (params: any) => events.mouseup!(params, widget, chart));
        }
        if (events.mouseover) {
          chart.on('mouseover', (params: any) => events.mouseover!(params, widget, chart));
        }
        if (events.mouseout) {
          chart.on('mouseout', (params: any) => events.mouseout!(params, widget, chart));
        }
      }
    });
    return this;
  }

  /**
   * Set stock navigation event handlers (common pattern for stock-related charts)
   * @param navigationCallback Function to handle navigation (receives stock symbol)
   * @param symbolField Field name to extract symbol from (default: 'symbol')
   * @param preferredEvent Preferred event type (default: 'dblclick')
   */
  setStockNavigationEvents(
    navigationCallback: (symbol: string) => void,
    symbolField: string = 'symbol',
    preferredEvent: 'click' | 'dblclick' | 'mousedown' = 'dblclick'
  ): this {
    const resolveTreemapSymbol = (params: any): string | undefined => {
      const d = params?.data;
      if (d && typeof d === 'object' && !Array.isArray(d)) {
        const sym = d[symbolField] ?? d.symbol ?? d.tradingsymbol;
        if (typeof sym === 'string' && sym.trim()) {
          return sym.trim();
        }
      }
      if (Array.isArray(params?.treePathInfo) && params.treePathInfo.length > 0) {
        for (let i = params.treePathInfo.length - 1; i >= 0; i--) {
          const nm = params.treePathInfo[i]?.name;
          if (typeof nm !== 'string' || !nm.trim()) {
            continue;
          }
          if (nm.includes('·')) {
            return nm.split('·')[0].trim();
          }
          if (nm !== 'Treemap Chart') {
            return nm.trim();
          }
        }
      }
      if (typeof params?.name === 'string' && params.name.includes('·')) {
        return params.name.split('·')[0].trim();
      }
      return undefined;
    };

    const eventHandler = (params: any, widget: IWidget, chart: any) => {
      const opt = widget?.config?.options as { series?: { type?: string }[] } | undefined;
      const series0 = opt?.series?.[0];
      const chartIsTreemap = series0?.type === 'treemap';
      const looksTreemap =
        params?.seriesType === 'treemap' ||
        params?.componentSubType === 'treemap' ||
        (chartIsTreemap &&
          params?.componentType === 'series' &&
          (params?.dataIndex != null || Array.isArray(params?.treePathInfo)));
      if (looksTreemap) {
        const sym = resolveTreemapSymbol(params);
        if (sym) {
          navigationCallback(sym);
        }
        return;
      }

      if (params.componentType === 'series' && params.data) {
        const d = params.data;
        const stockSymbol =
          typeof d === 'object' && d !== null && !Array.isArray(d)
            ? d[symbolField] ?? d.symbol ?? d.tradingsymbol
            : Array.isArray(d)
              ? d[0]
              : undefined;
        if (stockSymbol) {
          navigationCallback(String(stockSymbol).trim());
        }
      }
    };

    // Set the preferred event
    switch (preferredEvent) {
      case 'click':
        this.setClickEvent(eventHandler);
        break;
      case 'dblclick':
        this.setDoubleClickEvent(eventHandler);
        break;
      case 'mousedown':
        this.setMouseDownEvent(eventHandler);
        break;
    }

    return this;
  }

  /**
   * Set chart instance
   */
  setChartInstance(chartInstance: any): this {
    this.widgetBuilder.setChartInstance(chartInstance);
    return this;
  }

  /**
   * Set widget height based on gridster item dimensions
   * @param cellHeight - Height of each gridster cell (default: 30px)
   * @param margin - Margin between cells (default: 10px)
   */
  setHeightFromGridster(cellHeight: number = 30, margin: number = 10): this {
    this.widgetBuilder.setHeightFromGridster(cellHeight, margin);
    return this;
  }

  /**
   * Build and return the final widget
   */
  build(): IWidget {
    return this.widgetBuilder
      .setEChartsOptions(this.chartOptions as T)
      .build();
  }

  /**
   * Get the current chart options (useful for debugging or modification)
   */
  getChartOptions(): Partial<T> {
    return { ...this.chartOptions };
  }

  /**
   * Get the widget builder instance (for advanced usage)
   */
  getWidgetBuilder(): WidgetBuilder {
    return this.widgetBuilder;
  }

  /**
   * Static method to update data on an existing chart widget with retry mechanism
   */
  static updateData(widget: IWidget, data: any, retryOptions?: { maxAttempts?: number; baseDelay?: number }): void {
    WidgetBuilder.setData(widget, data);

    // Update chart instance if available
    if (widget.chartInstance) {
      try {
        widget.chartInstance.setOption(widget.config?.options as any, true);
      } catch (error) {
        console.error('Error updating chart:', error);
      }
    } else {
      // Use retry mechanism for chart updates
      this.retryChartUpdate(widget, retryOptions);
    }
  }

  /**
   * Retry mechanism for chart updates when chart instance is not immediately available
   */
  private static retryChartUpdate(widget: IWidget, options?: { maxAttempts?: number; baseDelay?: number }): void {
    const maxAttempts = options?.maxAttempts || 10;
    const baseDelay = options?.baseDelay || 100;
    let attempts = 0;
    
    const retryUpdate = () => {
      attempts++;
      
      if (widget.chartInstance) {
        try {
          widget.chartInstance.setOption(widget.config?.options as any, true);
          return;
        } catch (error) {
          console.error('Error updating chart on retry:', error);
        }
      }
      
      if (attempts < maxAttempts) {
        const delay = Math.min(baseDelay * Math.pow(1.5, attempts - 1), 2000);
        setTimeout(retryUpdate, delay);
      }
    };
    
    setTimeout(retryUpdate, baseDelay);
  }

  /**
   * Static method to check if a widget is a specific chart type
   */
  static isChartType(widget: IWidget, chartType: string): boolean {
    return widget.config.component === 'echart' && 
           (widget.config.options as any)?.series?.[0]?.type === chartType;
  }

  /**
   * Static method to get chart type from widget
   */
  static getChartType(widget: IWidget): string | null {
    if (widget.config.component === 'echart' && 
        (widget.config.options as any)?.series?.[0]?.type) {
      return (widget.config.options as any).series[0].type;
    }
    return null;
  }

  // --- Enhanced Data Transformation Methods ---

  /**
   * Transform generic data array to chart-specific format
   * This method should be overridden by specific chart builders
   */
  static transformData(data: any[], options?: ChartDataTransformOptions): any[] {
    return data; // Default implementation returns data as-is
  }

  /**
   * Apply filters to data array
   */
  static applyFilters(data: any[], filters: DataFilter[]): any[] {
    if (!filters || filters.length === 0) return data;

    return data.filter(item => {
      return filters.every(filter => {
        const propertyPath = filter.column || filter.property;
        if (!propertyPath) return true;
        const value = this.getNestedProperty(item, propertyPath);
        return this.matchesFilter(value, filter);
      });
    });
  }

  /**
   * Get nested property from object using dot notation
   */
  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Check if value matches filter criteria
   */
  private static matchesFilter(value: any, filter: DataFilter): boolean {
    switch (filter.operator) {
      case 'equals':
        return value === filter.value;
      case 'contains':
        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
      case 'greaterThan':
        return Number(value) > Number(filter.value);
      case 'lessThan':
        return Number(value) < Number(filter.value);
      case 'greaterThanOrEqual':
        return Number(value) >= Number(filter.value);
      case 'lessThanOrEqual':
        return Number(value) <= Number(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      default:
        return true;
    }
  }

  /**
   * Generate alternative/sample data for testing
   */
  static generateSampleData(template: any[], variationOptions?: DataVariationOptions): any[] {
    return template.map(item => {
      const newItem = { ...item };
      
      if (variationOptions?.randomizeNumericFields) {
        Object.keys(newItem).forEach(key => {
          if (typeof newItem[key] === 'number') {
            const variation = (Math.random() - 0.5) * 2 * (variationOptions.variationPercentage || 0.2);
            newItem[key] = Math.max(0, newItem[key] * (1 + variation));
          }
        });
      }
      
      return newItem;
    });
  }

  // --- Advanced Formatting Methods ---

  /**
   * Set currency formatter for tooltips and labels
   */
  setCurrencyFormatter(currencyCode: string = 'USD', locale: string = 'en-US'): this {
    const formatter = (value: number) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode
      }).format(value);
    };

    this.setTooltip(
      (this.chartOptions as any).tooltip?.trigger || 'item',
      (params: any) => {
        if (Array.isArray(params)) {
          return params.map(p => `${p.seriesName}<br/>${p.name}: ${formatter(p.value)}`).join('<br/>');
        }
        return `${params.name}: ${formatter(params.value)}`;
      }
    );

    return this;
  }

  /**
   * Set percentage formatter for tooltips and labels
   */
  setPercentageFormatter(decimals: number = 1): this {
    const formatter = (value: number) => `${value.toFixed(decimals)}%`;

    this.setTooltip(
      (this.chartOptions as any).tooltip?.trigger || 'item',
      (params: any) => {
        if (Array.isArray(params)) {
          return params.map(p => `${p.seriesName}<br/>${p.name}: ${formatter(p.value)}`).join('<br/>');
        }
        return `${params.name}: ${formatter(params.value)}`;
      }
    );

    return this;
  }

  /**
   * Set number formatter with thousands separators
   */
  setNumberFormatter(locale: string = 'en-US', options?: Intl.NumberFormatOptions): this {
    const formatter = (value: number) => {
      return new Intl.NumberFormat(locale, options).format(value);
    };

    this.setTooltip(
      (this.chartOptions as any).tooltip?.trigger || 'item',
      (params: any) => {
        if (Array.isArray(params)) {
          return params.map(p => `${p.seriesName}<br/>${p.name}: ${formatter(p.value)}`).join('<br/>');
        }
        return `${params.name}: ${formatter(params.value)}`;
      }
    );

    return this;
  }

  // --- Filter Integration Methods ---

  /**
   * Configure widget for filtering support
   * @param columnName The column name to filter on
   * @param filterBy How to filter: by the clicked element's value or by category
   */
  setFilterColumn(columnName: string, filterBy: FilterBy = FilterBy.Value): this {
    const widget = this.widgetBuilder.build();
    if (widget.config) {
      widget.config.filterColumn = columnName;
      (widget.config as any).filterBy = filterBy;
    }
    return this;
  }

  /**
   * Create filter value from chart interaction data
   */
  static createFilterFromChartData(chartData: any, filterColumn: string, filterBy: FilterBy = FilterBy.Value): DataFilter | null {
    if (!chartData || !filterColumn) return null;

    let filterValue: any;
    let displayValue: string;

    if (filterBy === FilterBy.Category) {
      // Filter by the category name (the column name itself)
      filterValue = filterColumn;
      displayValue = filterColumn;
    } else {
      // Filter by the specific value (default behavior)
      filterValue = chartData.name || chartData.value;
      displayValue = chartData.name || String(chartData.value);
    }

    return {
      property: filterColumn,
      operator: 'equals',
      value: filterValue,
      displayValue: displayValue
    };
  }

  /**
   * Set accessor property for global filtering logic
   * This enables central filtering by setting the accessor that will be used
   * to generate global filter criteria like <accessor> = <clicked-chart-element>
   */
  setAccessor(accessor: string): this {
    const widget = this.widgetBuilder.build();
    if (widget.config) {
      widget.config.accessor = accessor;
    }
    return this;
  }

  /**
   * Create global filter from chart interaction data using accessor
   * This method generates filter criteria in the format: <accessor> = <clicked-chart-element>
   */
  static createGlobalFilterFromChartData(chartData: any, accessor: string, filterBy: FilterBy = FilterBy.Value): any | null {
    if (!chartData || !accessor) return null;

    let filterValue: any;
    let displayValue: string;

    if (filterBy === FilterBy.Category) {
      // Filter by the category name (the accessor/column name itself)
      filterValue = accessor;
      displayValue = accessor;
    } else {
      // Filter by the specific value (default behavior)
      filterValue = chartData.name || chartData.value;
      displayValue = String(filterValue);
      if (!filterValue) return null;
    }

    return {
      accessor: accessor,
      operator: 'equals',
      value: filterValue,
      displayValue: displayValue,
      [accessor]: filterValue
    };
  }

  // --- Color and Styling Enhancements ---

  /**
   * Set gradient colors for chart elements
   */
  setGradientColors(startColor: string, endColor: string, direction: 'horizontal' | 'vertical' = 'vertical'): this {
    const gradient = {
      type: 'linear',
      x: 0,
      y: direction === 'vertical' ? 0 : 1,
      x2: direction === 'vertical' ? 0 : 1,
      y2: direction === 'vertical' ? 1 : 0,
      colorStops: [
        { offset: 0, color: startColor },
        { offset: 1, color: endColor }
      ]
    };

    if (!(this.seriesOptions as any).itemStyle) (this.seriesOptions as any).itemStyle = {};
    (this.seriesOptions as any).itemStyle.color = gradient;

    return this;
  }

  /**
   * Set predefined color palette
   */
  setPredefinedPalette(paletteName: ColorPalette): this {
    const palettes: Record<ColorPalette, string[]> = {
      business: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      finance: ['#2E8B57', '#4682B4', '#DAA520', '#DC143C', '#9370DB', '#20B2AA', '#FF6347', '#4169E1', '#32CD32'],
      modern: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2'],
      pastel: ['#FFB6C1', '#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD', '#F5DEB3', '#FFE4E1', '#E0FFFF', '#FAFAD2'],
      dark: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1', '#f39c12', '#e67e22', '#e74c3c']
    };

    return this.setColors(palettes[paletteName] || palettes['business']);
  }

  /**
   * Get palette colors for a specific palette
   */
  protected getPaletteColors(paletteName: ColorPalette): string[] {
    const palettes: Record<ColorPalette, string[]> = {
      business: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      finance: ['#2E8B57', '#4682B4', '#DAA520', '#DC143C', '#9370DB', '#20B2AA', '#FF6347', '#4169E1', '#32CD32'],
      modern: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#ffecd2'],
      pastel: ['#FFB6C1', '#87CEEB', '#98FB98', '#F0E68C', '#DDA0DD', '#F5DEB3', '#FFE4E1', '#E0FFFF', '#FAFAD2'],
      dark: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1', '#f39c12', '#e67e22', '#e74c3c']
    };

    return palettes[paletteName] || palettes['business'];
  }

  /**
   * Create currency formatter function
   */
  protected createCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): (value: number) => string {
    return (value: number) => {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(value);
    };
  }

  /**
   * Create percentage formatter function
   */
  protected createPercentageFormatter(decimals: number = 1): (value: number) => string {
    return (value: number) => `${value.toFixed(decimals)}%`;
  }

  /**
   * Create number formatter function
   */
  protected createNumberFormatter(decimals: number = 0, locale: string = 'en-US'): (value: number) => string {
    return (value: number) => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    };
  }

  /**
   * Set value formatter for tooltips
   */
  protected setValueFormatter(formatter: (value: number) => string): this {
    this.setTooltip(
      (this.chartOptions as any).tooltip?.trigger || 'item',
      (params: any) => {
        if (Array.isArray(params)) {
          return params.map(p => `${p.seriesName}<br/>${p.name}: ${formatter(p.value)}`).join('<br/>');
        }
        return `${params.name}: ${formatter(params.value)}`;
      }
    );
    return this;
  }
}

/**
 * Generic interface for chart data
 */
export interface ChartData {
  [key: string]: any;
}

/**
 * Common chart options interface
 */
export interface CommonChartOptions {
  title?: {
    text?: string;
    subtext?: string;
    left?: string | number;
    top?: string | number;
    textStyle?: {
      fontSize?: number;
      color?: string;
    };
  };
  tooltip?: {
    trigger?: string;
    formatter?: string | Function;
    backgroundColor?: string;
    borderColor?: string;
    textStyle?: {
      color?: string;
    };
  };
  legend?: {
    show?: boolean;
    orient?: string;
    left?: string | number;
    top?: string | number;
    bottom?: string | number;
    right?: string | number;
    textStyle?: {
      fontSize?: number;
      color?: string;
    };
  };
  grid?: {
    containLabel?: boolean;
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
    height?: string | number;
    width?: string | number;
  };
  xAxis?: any;
  yAxis?: any;
  series?: any[];
  animation?: boolean | any;
  backgroundColor?: string;
}

/**
 * Data transformation options interface
 */
export interface ChartDataTransformOptions {
  nameField?: string;
  valueField?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  groupBy?: string;
  aggregateBy?: string;
  aggregateFunction?: 'sum' | 'avg' | 'count' | 'max' | 'min';
  dateFormat?: string;
}

/**
 * Data filter interface
 */
export interface DataFilter {
  column?: string;
  property?: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'in';
  value: any;
  displayValue?: string;
}

/**
 * Custom event interface for chart filter changes
 */
export interface ChartFilterEvent {
  type: 'filterChange' | 'timeRangeChange' | 'customFilter';
  filterType: string;
  value: any;
  widgetId: string;
  metadata?: any;
}

/**
 * Data variation options for sample data generation
 */
export interface DataVariationOptions {
  randomizeNumericFields?: boolean;
  variationPercentage?: number;
  preserveStructure?: boolean;
}

/**
 * Predefined color palette types
 */
export type ColorPalette = 'business' | 'finance' | 'modern' | 'pastel' | 'dark';

/**
 * Filter by type enumeration
 * Determines how chart widgets should filter data when clicked
 */
export enum FilterBy {
  /**
   * Filter by the specific value of the clicked element
   * Example: clicking "Iron & Steel" filters to show only "Iron & Steel" data
   */
  Value = 'value',
  
  /**
   * Filter by the category name of the clicked element
   * Example: clicking any industry value filters by the "industry" category
   */
  Category = 'category'
}