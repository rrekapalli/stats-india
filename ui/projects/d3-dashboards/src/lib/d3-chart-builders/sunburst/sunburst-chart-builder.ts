import { IWidget, WidgetBuilder } from '../../../public-api';
// EChartsOption removed from 'd3';
import { D3ChartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../d3-chart-builder';

export interface SunburstChartData {
  name: string;
  value?: number;
  children?: SunburstChartData[];
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface SunburstChartSeriesOptions {
  name?: string;
  type?: string;
  radius?: string | string[];
  center?: string | string[];
  data?: SunburstChartData[];
  itemStyle?: {
    borderWidth?: number;
    borderColor?: string;
  };
  label?: {
    show?: boolean;
    formatter?: string;
    position?: string;
    fontSize?: number;
    color?: string;
    rotate?: string;
  };
  levels?: any[];
  sort?: string;
  animationDuration?: number;
  animationEasing?: string;
}

export interface SunburstChartOptions {
  series?: SunburstChartSeriesOptions[];
}

/**
 * Enhanced Sunburst Chart Builder extending the generic D3ChartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to hierarchical sunburst format
 * - Advanced formatting (currency, percentage, number)
 * - Predefined color palettes
 * - Filter integration
 * - Sample data generation
 * - Configuration presets for organizational and categorical analysis
 * - Enhanced update methods with retry mechanism
 */
export class D3SunburstChartBuilder extends D3ChartBuilder<SunburstChartOptions, SunburstChartSeriesOptions> {
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new D3SunburstChartBuilder instance
   */
  static create(): D3SunburstChartBuilder {
    return new D3SunburstChartBuilder();
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
    return 'sunburst';
  }

  /**
   * Get default series options for sunburst chart
   */
  private getDefaultSeriesOptions(): SunburstChartSeriesOptions {
    return {
      name: 'Sunburst Chart',
      type: 'sunburst',
      radius: ['20%', '90%'],
      center: ['50%', '50%'],
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff',
      },
      label: {
        show: true,
        formatter: '{b}',
        position: 'inside',
        fontSize: 12,
        color: '#fff',
        rotate: 'radial',
      },
      levels: [
        {
          itemStyle: {
            borderWidth: 2,
            borderColor: '#777',
          },
        },
        {
          itemStyle: {
            borderWidth: 1,
            borderColor: '#555',
          },
        },
        {
          itemStyle: {
            borderWidth: 1,
            borderColor: '#333',
          },
        },
      ],
      sort: 'desc',
      animationDuration: 1000,
      animationEasing: 'cubicOut',
    };
  }

  /**
   * Set the data for the sunburst chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data as SunburstChartData[];
    super.setData(data);
    return this;
  }

  /**
   * Set the radius of the sunburst chart
   */
  setRadius(radius: string | string[]): this {
    this.seriesOptions.radius = radius;
    return this;
  }

  /**
   * Set the center position of the sunburst chart
   */
  setCenter(center: string | string[]): this {
    this.seriesOptions.center = center;
    return this;
  }

  /**
   * Set the levels configuration for the sunburst chart
   */
  setLevels(levels: any[]): this {
    this.seriesOptions.levels = levels;
    return this;
  }

  /**
   * Set the sort order for the sunburst chart
   */
  setSort(sort: string): this {
    this.seriesOptions.sort = sort;
    return this;
  }

  /**
   * Set animation duration
   */
  setAnimationDuration(duration: number): this {
    this.seriesOptions.animationDuration = duration;
    return this;
  }

  /**
   * Set animation easing
   */
  setAnimationEasing(easing: string): this {
    this.seriesOptions.animationEasing = easing;
    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length > 0) {
      this.setLevels([
        { itemStyle: { color: colors[0] } },
        { itemStyle: { color: colors[1] || colors[0] } },
        { itemStyle: { color: colors[2] || colors[0] } }
      ]);
    }
    return this;
  }

  /**
   * Set currency formatter for values
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setTooltip('item', (params: any) => {
      return `${params.data.name}: ${formatter(params.data.value)}`;
    });
    return this;
  }

  /**
   * Set percentage formatter for values
   */
  override setPercentageFormatter(decimals: number = 1): this {
    const formatter = this.createPercentageFormatter(decimals);
    this.setTooltip('item', (params: any) => {
      return `${params.data.name}: ${formatter(params.data.value)}`;
    });
    return this;
  }

  /**
   * Set number formatter for values with custom options
   */
  setCustomNumberFormatter(decimals: number = 0, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setTooltip('item', (params: any) => {
      return `${params.data.name}: ${formatter(params.data.value)}`;
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
  generateSampleData(): this {
    const sampleData: SunburstChartData[] = [
      {
        name: 'Technology',
        value: 100,
        children: [
          {
            name: 'Software',
            value: 60,
            children: [
              { name: 'Frontend', value: 30 },
              { name: 'Backend', value: 30 }
            ]
          },
          {
            name: 'Hardware',
            value: 40,
            children: [
              { name: 'Servers', value: 25 },
              { name: 'Devices', value: 15 }
            ]
          }
        ]
      },
      {
        name: 'Marketing',
        value: 80,
        children: [
          { name: 'Digital', value: 50 },
          { name: 'Traditional', value: 30 }
        ]
      },
      {
        name: 'Operations',
        value: 70,
        children: [
          { name: 'Logistics', value: 40 },
          { name: 'Support', value: 30 }
        ]
      }
    ];

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for organizational structure
   */
  setOrganizationalStructureConfiguration(): this {
    return this
      .setPredefinedPalette('business')
      .setCustomNumberFormatter(0, 'en-US')
      .setRadius(['15%', '85%'])
      .setLabelFormatter('{b}')
      .setSort('desc');
  }

  /**
   * Configuration preset for budget allocation
   */
  setBudgetAllocationConfiguration(): this {
    return this
      .setPredefinedPalette('finance')
      .setCurrencyFormatter('USD', 'en-US')
      .setRadius(['20%', '90%'])
      .setLabelFormatter('{b}: {c}')
      .setSort('desc');
  }

  /**
   * Configuration preset for category analysis
   */
  setCategoryAnalysisConfiguration(): this {
    return this
      .setPredefinedPalette('modern')
      .setPercentageFormatter(1)
      .setRadius(['25%', '95%'])
      .setLabelFormatter('{b}')
      .setSort('desc');
  }

  /**
   * Transform generic data to hierarchical sunburst format
   */
  transformData(options: { 
    nameField?: string; 
    valueField?: string; 
    parentField?: string; 
    levelField?: string; 
    categoryField?: string; 
  } & ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      nameField = 'name',
      valueField = 'value',
      parentField = 'parent',
      levelField = 'level',
      categoryField = 'category',
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      // Apply filters first
      let filteredData = this.data;
      if ((options as any).filters && (options as any).filters.length > 0) {
        filteredData = D3ChartBuilder.applyFilters(this.data, (options as any).filters);
      }

      // Build hierarchical structure
      const transformedData = this.buildHierarchy(filteredData, nameField, valueField, parentField, levelField);

      // Apply sorting
      if (sortBy === 'value') {
        this.sortHierarchy(transformedData, sortOrder);
      }

      // Apply limit (only to top level)
      if (limit && limit > 0 && transformedData.length > limit) {
        transformedData.splice(limit);
      }

      this.seriesOptions.data = transformedData;

    } catch (error) {
      console.error('Error transforming sunburst chart data:', error);
    }

    return this;
  }

  /**
   * Build hierarchical structure from flat data
   */
  private buildHierarchy(data: any[], nameField: string, valueField: string, parentField: string, levelField: string): SunburstChartData[] {
    const nodeMap = new Map<string, SunburstChartData>();
    const rootNodes: SunburstChartData[] = [];

    // First pass: create all nodes
    data.forEach(item => {
      const name = item[nameField] || 'Unknown';
      const value = parseFloat(item[valueField]) || 0;
      const parent = item[parentField];
      
      const node: SunburstChartData = {
        name,
        value,
        children: []
      };

      nodeMap.set(name, node);
      
      if (!parent) {
        rootNodes.push(node);
      }
    });

    // Second pass: build hierarchy
    data.forEach(item => {
      const name = item[nameField] || 'Unknown';
      const parent = item[parentField];
      
      if (parent && nodeMap.has(parent) && nodeMap.has(name)) {
        const parentNode = nodeMap.get(parent)!;
        const childNode = nodeMap.get(name)!;
        
        if (!parentNode.children) {
          parentNode.children = [];
        }
        parentNode.children.push(childNode);
      }
    });

    return rootNodes;
  }

  /**
   * Sort hierarchy by value
   */
  private sortHierarchy(nodes: SunburstChartData[], order: string): void {
    nodes.sort((a, b) => {
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return order === 'asc' ? valueA - valueB : valueB - valueA;
    });

    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        this.sortHierarchy(node.children, order);
      }
    });
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
    const root = Array.isArray(data) ? data[0] : data;
    const spec = widget.config?.options as import('../../chart-spec').D3ChartSpec;
    if (spec && root && typeof root === 'object') {
      spec.chartType = 'sunburst';
      spec.hierarchy = root as import('../../chart-spec').HierarchyNode;
      widget.chartInstance?.update(spec);
    }
    widget.data = data;
  }

  /**
   * Static method to check if a widget is a sunburst chart
   */
  static isSunburstChart(widget: IWidget): boolean {
    return D3ChartBuilder.isChartType(widget, 'sunburst');
  }

  /**
   * Static method to create a sunburst chart widget with default configuration
   */
  static createSunburstChartWidget(data?: SunburstChartData[]): WidgetBuilder {
    return D3SunburstChartBuilder.create()
      .setData(data || [])
      .setHeader('Sunburst Chart')
      .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
      .getWidgetBuilder();
  }

  /**
   * Static method to export chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const data = widget.data || [];
    const exportData: any[] = [];

    const flattenData = (items: SunburstChartData[], level: number = 0, parent: string = ''): void => {
      items.forEach(item => {
        exportData.push({
          'Level': level,
          'Parent': parent,
          'Name': item.name,
          'Value': item.value || 0,
        });

        if (item.children && item.children.length > 0) {
          flattenData(item.children, level + 1, item.name);
        }
      });
    };

    flattenData(data as SunburstChartData[]);
    return exportData;
  }

  /**
   * Static method to get headers for the exported data
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Level', 'Parent', 'Name', 'Value'];
  }

  /**
   * Static method to get sheet name for the exported data
   */
  static override getExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Sunburst Chart';
    return title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31);
  }
}

/**
 * Convenience function to create a sunburst chart widget
 */
export function createSunburstChartWidget(data?: SunburstChartData[]): WidgetBuilder {
  return D3SunburstChartBuilder.createSunburstChartWidget(data);
} 