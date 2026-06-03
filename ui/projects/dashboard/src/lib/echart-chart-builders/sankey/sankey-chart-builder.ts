import { IWidget } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder } from '../apache-echart-builder';

export interface SankeyNode {
  name: string;
  value?: number;
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
}

export interface SankeyChartData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

export interface SankeyChartSeriesOptions {
  name?: string;
  type?: string;
  data?: SankeyNode[];
  links?: SankeyLink[];
  layout?: 'none' | 'left' | 'right';
  nodeWidth?: number;
  nodeGap?: number;
  nodeAlign?: 'justify' | 'left' | 'right';
  layoutIterations?: number;
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  lineStyle?: {
    color?: string;
    opacity?: number;
    curveness?: number;
  };
  emphasis?: {
    focus?: 'adjacency' | 'source' | 'target';
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
    lineStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
}

export interface SankeyChartOptions {
  series?: SankeyChartSeriesOptions[];
}

/**
 * Sankey Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Usage examples:
 * 
 * // Basic usage with default options
 * const widget = SankeyChartBuilder.create()
 *   .setData({
 *     nodes: [
 *       { name: 'Income' },
 *       { name: 'Expenses' },
 *       { name: 'Savings' }
 *     ],
 *     links: [
 *       { source: 'Income', target: 'Expenses', value: 70 },
 *       { source: 'Income', target: 'Savings', value: 30 }
 *     ]
 *   })
 *   .setHeader('Cash Flow')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with custom options
 * const widget = SankeyChartBuilder.create()
 *   .setData(sankeyData)
 *   .setTitle('Financial Flow Analysis', 'Money Movement')
 *   .setNodeWidth(20)
 *   .setNodeGap(8)
 *   .setLayout('left')
 *   .setCurveness(0.5)
 *   .setTooltip('item', '{b}: {c}')
 *   .setHeader('Custom Sankey Chart')
 *   .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
 *   .build();
 */
export class SankeyChartBuilder extends ApacheEchartBuilder<SankeyChartOptions, SankeyChartSeriesOptions> {

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new SankeyChartBuilder instance
   */
  static create(): SankeyChartBuilder {
    return new SankeyChartBuilder();
  }

  /**
   * Implement abstract method to get default options
   */
  protected override getDefaultOptions(): any {
    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: '{b}: {c}',
      },
      legend: {
        show: false,
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'sankey';
  }

  /**
   * Get default series options for sankey chart
   */
  private getDefaultSeriesOptions(): SankeyChartSeriesOptions {
    return {
      name: 'Sankey Chart',
      type: 'sankey',
      emphasis: {
        focus: 'adjacency',
      },
      lineStyle: {
        color: 'source',
        curveness: 0.5,
      },
    };
  }

  /**
   * Set the data for the sankey chart
   */
  override setData(data: SankeyChartData): this {
    this.seriesOptions.data = data.nodes;
    this.seriesOptions.links = data.links;
    super.setData(data);
    return this;
  }

  /**
   * Set node width
   */
  setNodeWidth(width: number): this {
    this.seriesOptions.nodeWidth = width;
    return this;
  }

  /**
   * Set node gap
   */
  setNodeGap(gap: number): this {
    this.seriesOptions.nodeGap = gap;
    return this;
  }

  /**
   * Set node alignment
   */
  setNodeAlign(align: 'justify' | 'left' | 'right'): this {
    this.seriesOptions.nodeAlign = align;
    return this;
  }

  /**
   * Set layout iterations
   */
  setLayoutIterations(iterations: number): this {
    this.seriesOptions.layoutIterations = iterations;
    return this;
  }

  /**
   * Set layout direction
   */
  setLayout(layout: 'none' | 'left' | 'right'): this {
    this.seriesOptions.layout = layout;
    return this;
  }

  /**
   * Set line curveness
   */
  setCurveness(curveness: number): this {
    if (!this.seriesOptions.lineStyle) this.seriesOptions.lineStyle = {};
    this.seriesOptions.lineStyle.curveness = curveness;
    return this;
  }

  /**
   * Set line color
   */
  setLineColor(color: string): this {
    if (!this.seriesOptions.lineStyle) this.seriesOptions.lineStyle = {};
    this.seriesOptions.lineStyle.color = color;
    return this;
  }

  /**
   * Set node colors
   */
  setNodeColors(colors: string[]): this {
    if (!this.seriesOptions.itemStyle) this.seriesOptions.itemStyle = {};
    (this.seriesOptions.itemStyle as any).color = colors;
    return this;
  }

  /**
   * Set emphasis focus
   */
  setEmphasisFocus(focus: 'adjacency' | 'source' | 'target'): this {
    if (!this.seriesOptions.emphasis) this.seriesOptions.emphasis = {};
    this.seriesOptions.emphasis.focus = focus;
    return this;
  }

  /**
   * Build the widget
   */
  override build(): IWidget {
    // Merge series options with chart options, splitting nodes/links
    let nodes = (this.seriesOptions.data as any)?.nodes;
    let links = (this.seriesOptions.data as any)?.links;
    const finalOptions: SankeyChartOptions = {
      ...this.chartOptions,
      series: [{
        ...this.seriesOptions,
        type: 'sankey',
        data: nodes,
        links: links,
      }],
    };

    return this.widgetBuilder
      .setEChartsOptions(finalOptions)
      .build();
  }

  /**
   * Static method to update data in an existing widget with enhanced retry mechanism
   */
  static override updateData(widget: IWidget, data: SankeyChartData, retryOptions?: { maxAttempts?: number; baseDelay?: number }): void {
    if ((widget.config?.options as any)?.series?.[0]) {
      (widget.config.options as any).series[0].data = data.nodes;
      (widget.config.options as any).series[0].links = data.links;
    }
    widget.data = data;
    ApacheEchartBuilder.updateData(widget, data, retryOptions);
  }

  /**
   * Transform generic data array to sankey format
   */
  static transformToSankeyData(data: any[], options?: {
    nodeField?: string;
    sourceField?: string;
    targetField?: string;
    valueField?: string;
    aggregateBy?: 'sum' | 'count';
  }): SankeyChartData {
    if (!data || data.length === 0) return { nodes: [], links: [] };

    const sourceField = options?.sourceField || 'source';
    const targetField = options?.targetField || 'target';
    const valueField = options?.valueField || 'value';
    const aggregateBy = options?.aggregateBy || 'sum';

    // Extract unique nodes
    const nodeSet = new Set<string>();
    data.forEach(item => {
      nodeSet.add(String(item[sourceField]));
      nodeSet.add(String(item[targetField]));
    });

    const nodes: SankeyNode[] = Array.from(nodeSet).map(name => ({ name }));

    // Transform links and aggregate if needed
    const linkMap = new Map<string, number>();
    
    data.forEach(item => {
      const source = String(item[sourceField]);
      const target = String(item[targetField]);
      const value = Number(item[valueField]) || 1;
      const key = `${source}->${target}`;

      if (linkMap.has(key)) {
        const existingValue = linkMap.get(key)!;
        linkMap.set(key, aggregateBy === 'sum' ? existingValue + value : existingValue + 1);
      } else {
        linkMap.set(key, aggregateBy === 'sum' ? value : 1);
      }
    });

    const links: SankeyLink[] = Array.from(linkMap.entries()).map(([key, value]) => {
      const [source, target] = key.split('->');
      return { source, target, value };
    });

    return { nodes, links };
  }

  /**
   * Create financial flow configuration
   */
  setFinancialFlow(): this {
    return this
      .setNodeWidth(20)
      .setNodeGap(8)
      .setLayout('left')
      .setCurveness(0.5)
      .setEmphasisFocus('adjacency')
      .setNodeColors(['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']);
  }

  /**
   * Create budget allocation configuration
   */
  setBudgetAllocation(): this {
    return this
      .setNodeWidth(15)
      .setNodeGap(10)
      .setLayout('left')
      .setCurveness(0.4)
      .setEmphasisFocus('adjacency')
      .setNodeColors(['#2E8B57', '#4682B4', '#DAA520', '#DC143C', '#9370DB']);
  }

  /**
   * Create investment flow configuration
   */
  setInvestmentFlow(): this {
    return this
      .setNodeWidth(25)
      .setNodeGap(12)
      .setLayout('left')
      .setCurveness(0.3)
      .setEmphasisFocus('adjacency')
      .setNodeColors(['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']);
  }

  /**
   * Set percentage display for sankey values
   */
  setPercentageDisplay(): this {
    this.setTooltip('item', (params: any) => {
      if (params.data.source) {
        // This is a link
        return `${params.data.source} → ${params.data.target}<br/>Value: ${params.data.value}%`;
      } else {
        // This is a node
        return `${params.data.name}<br/>Total: ${params.data.value || 0}%`;
      }
    });
    return this;
  }

  /**
   * Set currency display for sankey values
   */
  setCurrencyDisplay(currencyCode: string = 'USD', locale: string = 'en-US'): this {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    this.setTooltip('item', (params: any) => {
      if (params.data.source) {
        // This is a link
        return `${params.data.source} → ${params.data.target}<br/>Amount: ${formatter.format(params.data.value)}`;
      } else {
        // This is a node
        return `${params.data.name}<br/>Total: ${formatter.format(params.data.value || 0)}`;
      }
    });
    return this;
  }

  /**
   * Create minimal test configuration for debugging
   */
  setMinimalConfiguration(): this {
    return this
      .setNodeWidth(10)
      .setNodeGap(5)
      .setLayout('none')
      .setCurveness(0.5)
      .setEmphasisFocus('adjacency');
  }

  /**
   * Check if widget is a sankey chart
   */
  static isSankeyChart(widget: IWidget): boolean {
    return widget.config?.component === 'echart' && 
           (widget.config?.options as any)?.series?.[0]?.type === 'sankey';
  }

  /**
   * Export sankey chart data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const data = widget.data as SankeyChartData;
    if (!data || !data.links) return [];

    return data.links.map(link => ({
      'Source': link.source,
      'Target': link.target,
      'Value': link.value,
    }));
  }

  /**
   * Get headers for sankey chart export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Source', 'Target', 'Value'];
  }

  /**
   * Get sheet name for sankey chart export
   */
  static override getExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Sankey Chart';
    return title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31);
  }
} 