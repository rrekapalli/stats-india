import { IWidget, WidgetBuilder } from '../../../public-api';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, DataFilter, FilterBy } from '../d3-chart-builder';

export interface PieChartData {
  value: number;
  name: string;
}

export interface PieChartSeriesOptions {
  name?: string;
  type?: string;
  radius?: string | string[];
  center?: string | string[];
  itemStyle?: {
    borderRadius?: number;
    color?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  };
  label?: {
    show?: boolean;
    formatter?: string | Function;
    position?: string;
    fontSize?: number;
    color?: string;
  };
  emphasis?: {
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
  data?: PieChartData[];
}

export interface PieChartOptions {
  series?: PieChartSeriesOptions[];
}

/**
 * Pie Chart Builder extending the generic D3ChartBuilder
 * 
 * Usage examples:
 * 
 * // Basic usage with default options
 * const widget = D3PieChartBuilder.create()
 *   .setData(initialData)
 *   .setHeader('Asset Allocation')
 *   .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with custom options
 * const widget = D3PieChartBuilder.create()
 *   .setData(initialData)
 *   .setTitle('Portfolio Distribution', 'As of December 2024')
 *   .setRadius(['40%', '70%'])
 *   .setCenter(['50%', '60%'])
 *   .setLabelFormatter('{b}: {c} ({d}%)')
 *   .setColors(['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'])
 *   .setTooltip('item', '{b}: {c} ({d}%)')
 *   .setLegend('horizontal', 'bottom')
 *   .setHeader('Custom Pie Chart')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Update widget data dynamically
 * D3PieChartBuilder.updateData(widget, newData);
 */
export class D3PieChartBuilder extends D3ChartBuilder<PieChartOptions, PieChartSeriesOptions> {
  protected filterColumn?: string;

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new D3PieChartBuilder instance
   */
  static create(): D3PieChartBuilder {
    return new D3PieChartBuilder();
  }

  /**
   * Implement abstract method to get default options
   */
  protected override getDefaultOptions(): any {
    return {
      grid: {
        containLabel: true,
        top: '15%',
        left: '5%',
        right: '5%',
        bottom: '15%',
        height: '70%',
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        show: true,
        orient: 'vertical',
        left: 'left',
        top: 'middle',
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'pie';
  }

  /**
   * Get default series options for pie chart
   */
  private getDefaultSeriesOptions(): PieChartSeriesOptions {
    return {
      name: 'Pie Chart',
      type: 'pie',
      radius: ['30%', '60%'],
      center: ['50%', '50%'],
      itemStyle: {
        borderRadius: 2,
      },
      label: {
        formatter: '{b}\n{c}%\n({d})%',
        show: true,
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
   * Set the data for the pie chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data as PieChartData[];
    super.setData(data);
    return this;
  }

  /**
   * Set the radius of the pie chart
   */
  setRadius(radius: string | string[]): this {
    this.seriesOptions.radius = radius;
    return this;
  }

  /**
   * Set the center position of the pie chart
   */
  setCenter(center: string | string[]): this {
    this.seriesOptions.center = center;
    return this;
  }

  /**
   * Override setShowLegend method to control legend visibility for pie charts
   */
  override setShowLegend(show: boolean): this {
    if (!(this.chartOptions as any).legend) {
      (this.chartOptions as any).legend = {};
    }
    (this.chartOptions as any).legend.show = show;
    return this;
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    return super.build();
  }

  /**
   * Static method to update data on an existing pie chart widget with enhanced retry mechanism
   */
  static override updateData(widget: IWidget, data: any, retryOptions?: { maxAttempts?: number; baseDelay?: number }): void {
    D3ChartBuilder.updateData(widget, data, retryOptions);
  }

  /**
   * Transform generic data array to pie chart format
   */
  static override transformData(data: any[], options?: { valueField?: string; nameField?: string; sortBy?: 'value' | 'name' }): PieChartData[] {
    if (!data || data.length === 0) return [];

    const valueField = options?.valueField || 'value';
    const nameField = options?.nameField || 'name';

    let transformedData = data.map(item => ({
      value: Number(item[valueField]) || 0,
      name: String(item[nameField]) || 'Unknown'
    }));

    // Sort if requested
    if (options?.sortBy === 'value') {
      transformedData.sort((a, b) => b.value - a.value);
    } else if (options?.sortBy === 'name') {
      transformedData.sort((a, b) => a.name.localeCompare(b.name));
    }

    return transformedData;
  }

  /**
   * Calculate and add percentage values to pie chart data
   */
  static addPercentages(data: PieChartData[]): (PieChartData & { percentage: number })[] {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
  }

  /**
   * Create filter from pie chart click data
   */
  static createFilterFromPieClick(clickData: any, filterColumn: string): any {
    if (!clickData || !clickData.name) return null;

    return {
      accessor: filterColumn,
      filterColumn: filterColumn,
      [filterColumn]: clickData.name,
      value: clickData.name,
      percentage: clickData.value?.toString() || '0'
    };
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

    const filterColumn = this.filterColumn; // Store in local variable to satisfy TypeScript
    const uniqueValues = [...new Set(this.data.map(item => item[filterColumn]))];
    return {
      column: this.filterColumn,
      operator: 'in' as const,
      value: uniqueValues
    };
  }

  /**
   * Set donut chart style (inner radius)
   */
  setDonutStyle(innerRadius: string = '40%', outerRadius: string = '70%'): this {
    this.seriesOptions.radius = [innerRadius, outerRadius];
    return this;
  }

  /**
   * Set pie chart to display percentages in labels
   */
  setPercentageLabels(showPercentage: boolean = true, decimals: number = 1): this {
    if (showPercentage) {
      this.seriesOptions.label = {
        ...this.seriesOptions.label,
        formatter: `{b}: {c} ({d}%)`
      };
    }
    return this;
  }

  /**
   * Configure for financial data display
   */
  setFinancialDisplay(currencyCode: string = 'USD', locale: string = 'en-US'): this {
    this.setCurrencyFormatter(currencyCode, locale);
    
    this.seriesOptions.label = {
      ...this.seriesOptions.label,
      formatter: (params: any) => {
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyCode,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        return `${params.data.name}\n${formatter.format(params.data.value)}\n(${params.percent}%)`;
      }
    };

    return this;
  }

  /**
   * Static method to check if a widget is a pie chart
   */
  static isPieChart(widget: IWidget): boolean {
    return D3ChartBuilder.isChartType(widget, 'pie');
  }

  /**
   * Static method to create a pie chart widget with default configuration
   * (for backward compatibility)
   */
  static createPieChartWidget(data?: PieChartData[]): WidgetBuilder {
    const builder = D3PieChartBuilder.create();
    if (data) {
      builder.setData(data);
    }
    return builder.toWidgetBuilder();
  }

  /**
   * Export pie chart data for Excel/CSV export
   * Extracts category names, values, and calculated percentages
   * @param widget - Widget containing pie chart data
   * @returns Array of data rows for export
   */
  static override exportData(widget: IWidget): any[] {
    const series = (widget.config?.options as any)?.series?.[0];
    
    if (!series?.data) {
      console.warn('D3PieChartBuilder.exportData - No series data found');
      return [];
    }

    return series.data.map((item: any) => [
      item.name || 'Unknown',
      item.value || 0,
      D3PieChartBuilder.calculatePercentage(item.value, series.data)
    ]);
  }

  /**
   * Get headers for pie chart export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Category', 'Value', 'Percentage'];
  }

  /**
   * Get sheet name for pie chart export
   */
  static override getExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Sheet';
    return title.replace(/[^\w\s]/gi, '').substring(0, 31).trim();
  }

  /**
   * Calculate percentage for pie chart data
   */
  private static calculatePercentage(value: number, data: any[]): string {
    const total = data.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(2)}%`;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use D3PieChartBuilder.create() instead
 */
export function createPieChartWidget(data?: PieChartData[]): WidgetBuilder {
  return D3PieChartBuilder.createPieChartWidget(data);
} 