import { IWidget, WidgetBuilder } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, DataFilter } from '../apache-echart-builder';

export interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

export interface TreemapSeriesOptions {
  name?: string;
  type?: string;
  data?: TreemapData[];
  top?: string | number;
  left?: string | number;
  right?: string | number;
  bottom?: string | number;
  breadcrumb?: {
    show?: boolean;
    top?: string | number;
    left?: string | number;
    right?: string | number;
    bottom?: string | number;
    height?: number;
    emptyItemWidth?: number;
    itemStyle?: {
      color?: string;
      borderColor?: string;
      borderWidth?: number;
      shadowBlur?: number;
      shadowColor?: string;
      textStyle?: {
        color?: string;
      };
    };
    emphasis?: {
      itemStyle?: {
        color?: string;
      };
    };
  };
  itemStyle?: {
    borderColor?: string;
    borderWidth?: number;
    gapWidth?: number;
  };
  label?: {
    show?: boolean;
    formatter?: string | Function;
    fontSize?: number;
    color?: string;
  };
  levels?: Array<{
    itemStyle?: {
      borderColor?: string;
      borderWidth?: number;
      gapWidth?: number;
      borderColorSaturation?: number;
    };
    label?: {
      show?: boolean;
      formatter?: string;
      fontSize?: number;
      fontWeight?: string;
    };
    upperLabel?: {
      show?: boolean;
    };
  }>;
  emphasis?: {
    itemStyle?: {
      shadowBlur?: number;
      shadowOffsetX?: number;
      shadowColor?: string;
    };
  };
  roam?: boolean;
  nodeClick?: string;
  width?: string | number;
  height?: string | number;
  animation?: boolean;
  animationDuration?: number;
  animationDurationUpdate?: number;
  animationEasing?: string;
  animationEasingUpdate?: string;
}

export interface TreemapChartOptions {
  series?: TreemapSeriesOptions[];
}

/**
 * Treemap Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Usage examples:
 * 
 * // Basic usage with default options
 * const widget = TreemapChartBuilder.create()
 *   .setData(initialData)
 *   .setHeader('Portfolio Distribution')
 *   .setPosition({ x: 0, y: 0, cols: 4, rows: 4 })
 *   .build();
 * 
 * // Advanced usage with custom options
 * const widget = TreemapChartBuilder.create()
 *   .setData(initialData)
 *   .setTitle('Investment Portfolio', 'By Asset Class and Sector')
 *   .setBreadcrumb(true, 'top', 'left', 'right', 'bottom')
 *   .setItemStyle('#fff', 1, 1)
 *   .setLabelFormatter('{b}: {c}')
 *   .setLevels([
 *     {
 *       itemStyle: { borderColor: '#777', borderWidth: 0, gapWidth: 1 },
 *       label: { show: false }
 *     },
 *     {
 *       itemStyle: { borderColor: '#555', borderWidth: 5, gapWidth: 1 },
 *       label: { show: true }
 *     }
 *   ])
 *   .setEmphasis(10, 0, 'rgba(0, 0, 0, 0.5)')
 *   .setRoam(true)
 *   .setNodeClick('zoomToNode')
 *   .setTooltip('item', '{b}: {c}')
 *   .setHeader('Investment Portfolio')
 *   .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
 *   .build();
 * 
 * // Update widget data dynamically
 * TreemapChartBuilder.updateData(widget, newData);
 */
export class TreemapChartBuilder extends ApacheEchartBuilder<TreemapChartOptions, TreemapSeriesOptions> {
  protected filterColumn?: string;

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new TreemapChartBuilder instance
   */
  static create(): TreemapChartBuilder {
    return new TreemapChartBuilder();
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
      series: [],
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return 'treemap';
  }

  /**
   * Get default series options for treemap chart
   */
  private getDefaultSeriesOptions(): TreemapSeriesOptions {
    return {
      name: 'Treemap Chart',
      type: 'treemap',
      top: '13%',
      left: '2%',
      right: '2%',
      bottom: '5%',
      breadcrumb: {
        show: true,
        top: '5%',
        left: '2%',
        right: '2%',
        height: 22,
      },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 1,
        gapWidth: 1,
      },
      label: {
        show: true,
        formatter: '{b}',
        fontSize: 12,
        color: '#333',
      },
      levels: [
        {
          itemStyle: {
            borderColor: '#777',
            borderWidth: 1,
            gapWidth: 1,
          },
          label: {
            show: false,
          },
        },
        {
          itemStyle: {
            borderColor: '#555',
            borderWidth: 1,
            gapWidth: 1,
          },
          label: {
            show: true,
          },
        },
        {
          itemStyle: {
            borderColor: '#555',
            borderWidth: 1,
            gapWidth: 1,
          },
          label: {
            show: true,
          },
        },
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 3,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      roam: true,
      nodeClick: 'zoomToNode',
    };
  }

  /**
   * Set the data for the treemap chart
   */
  override setData(data: any): this {
    this.seriesOptions.data = data as TreemapData[];
    super.setData(data);
    return this;
  }

  /**
   * Set breadcrumb configuration with enhanced styling
   */
  setBreadcrumb(show: boolean, top?: string | number, left?: string | number, right?: string | number, bottom?: string | number): this {
    this.seriesOptions.breadcrumb = {
      show,
      top,
      left,
      right,
      bottom,
      height: 22,
      emptyItemWidth: 25,
      itemStyle: {
        color: 'rgba(0,0,0,0.7)',
        borderColor: 'rgba(0,0,0,0.7)',
        borderWidth: 1,
        shadowBlur: 3,
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        textStyle: {
          color: '#fff'
        }
      },
      emphasis: {
        itemStyle: {
          color: 'rgba(0,0,0,0.9)'
        }
      }
    };
    return this;
  }

  /**
   * Set item style for treemap
   */
  setItemStyle(borderColor: string, borderWidth: number, gapWidth: number): this {
    this.seriesOptions.itemStyle = {
      borderColor,
      borderWidth,
      gapWidth,
    };
    return this;
  }

  /**
   * Set label formatter for treemap
   */
  override setLabelFormatter(formatter: string | Function): this {
    if (!this.seriesOptions.label) this.seriesOptions.label = {};
    this.seriesOptions.label.formatter = formatter;
    return this;
  }

  /**
   * Set levels configuration for treemap
   */
  setLevels(levels: Array<{
    itemStyle?: {
      borderColor?: string;
      borderWidth?: number;
      gapWidth?: number;
      borderColorSaturation?: number;
    };
    label?: {
      show?: boolean;
      formatter?: string;
      fontSize?: number;
      fontWeight?: string;
    };
    upperLabel?: {
      show?: boolean;
    };
  }>): this {
    this.seriesOptions.levels = levels;
    return this;
  }

  /**
   * Set roam option for treemap
   */
  setRoam(roam: boolean): this {
    this.seriesOptions.roam = roam;
    return this;
  }

  /**
   * Set node click behavior
   */
  setNodeClick(nodeClick: string): this {
    this.seriesOptions.nodeClick = nodeClick;
    return this;
  }

  /**
   * Treemap: ECharts often omits series params on `chart.on('dblclick')`. Use zrender `dblclick`
   * plus `TreemapView.findTarget` (via `getViewOfSeriesModel`) for reliable hit-testing.
   */
  override setStockNavigationEvents(
    navigationCallback: (symbol: string) => void,
    symbolField: string = 'tradingsymbol',
    preferredEvent: 'click' | 'dblclick' | 'mousedown' = 'dblclick'
  ): this {
    if (preferredEvent !== 'dblclick') {
      return super.setStockNavigationEvents(navigationCallback, symbolField, preferredEvent);
    }

    const resolveFromParams = (params: any): string | undefined => {
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

    const resolveFromTreeNode = (seriesModel: any, node: any): string | undefined => {
      if (!node || node.dataIndex == null) {
        return undefined;
      }
      const data = seriesModel.getData();
      const item = data.getRawDataItem(node.dataIndex) as Record<string, unknown> | undefined;
      if (item && typeof item === 'object') {
        const v = item[symbolField] ?? item['tradingsymbol'] ?? item['symbol'];
        if (typeof v === 'string' && v.trim()) {
          return v.trim();
        }
        const n = item['name'];
        if (typeof n === 'string' && n.includes('·')) {
          return n.split('·')[0].trim();
        }
        if (typeof n === 'string' && n.trim()) {
          return n.trim();
        }
      }
      return undefined;
    };

    this.widgetBuilder.setEvents((widget: IWidget, chart: any) => {
      if (!chart) {
        return;
      }

      let lastNavAt = 0;
      const safeNav = (sym: string | undefined) => {
        const s = (sym || '').trim();
        if (!s) {
          return;
        }
        const t = Date.now();
        if (t - lastNavAt < 450) {
          return;
        }
        lastNavAt = t;
        navigationCallback(s);
      };

      const pickOffsets = (ze: any): { offsetX: number; offsetY: number } => {
        if (!ze) {
          return { offsetX: 0, offsetY: 0 };
        }
        const zx = ze.zrX ?? ze.x;
        const zy = ze.zrY ?? ze.y;
        if (typeof zx === 'number' && typeof zy === 'number' && !Number.isNaN(zx) && !Number.isNaN(zy)) {
          return { offsetX: zx, offsetY: zy };
        }
        if (typeof ze.offsetX === 'number' && typeof ze.offsetY === 'number') {
          return { offsetX: ze.offsetX, offsetY: ze.offsetY };
        }
        const ev = ze.event;
        if (ev && typeof ev.offsetX === 'number' && typeof ev.offsetY === 'number') {
          return { offsetX: ev.offsetX, offsetY: ev.offsetY };
        }
        return { offsetX: 0, offsetY: 0 };
      };

      const tryHitTiles = (e: { offsetX: number; offsetY: number }) => {
        const opt = chart.getOption() as { series?: { type?: string }[] };
        if (!opt?.series?.length || opt.series[0].type !== 'treemap') {
          return;
        }
        const ecModel = chart.getModel();
        const byType = ecModel.getSeriesByType?.('treemap') as unknown[] | undefined;
        const seriesModel =
          (Array.isArray(byType) && byType[0]) || ecModel.getSeriesByIndex(0);
        if (!seriesModel) {
          return;
        }
        const view = chart.getViewOfSeriesModel(seriesModel) as { findTarget?: (x: number, y: number) => { node?: unknown } | undefined };
        if (!view || typeof view.findTarget !== 'function') {
          return;
        }
        const targetInfo = view.findTarget(e.offsetX, e.offsetY);
        const node = targetInfo?.node as { dataIndex?: number } | undefined;
        if (!node) {
          return;
        }
        safeNav(resolveFromTreeNode(seriesModel, node));
      };

      const chartHandler = (params: any) => {
        const wopt = widget?.config?.options as { series?: { type?: string }[] } | undefined;
        if (wopt?.series?.[0]?.type !== 'treemap') {
          return;
        }
        const looksTreemap =
          params?.seriesType === 'treemap' ||
          params?.componentSubType === 'treemap' ||
          (params?.componentType === 'series' &&
            (params?.dataIndex != null || Array.isArray(params?.treePathInfo)));
        if (!looksTreemap) {
          return;
        }
        safeNav(resolveFromParams(params));
      };

      const prevChartHandler = (chart as any).__moneytreeTreemapDblChart as
        | ((params: unknown) => void)
        | undefined;
      if (prevChartHandler) {
        chart.off('dblclick', prevChartHandler);
      }
      (chart as any).__moneytreeTreemapDblChart = chartHandler;
      chart.on('dblclick', chartHandler);

      const ngxDblHandler = (ev: any) => {
        chartHandler(ev);
        const native = ev?.event;
        const dom = chart.getDom() as HTMLElement | null;
        if (native && dom && typeof native.clientX === 'number' && typeof native.clientY === 'number') {
          const r = dom.getBoundingClientRect();
          tryHitTiles({
            offsetX: native.clientX - r.left,
            offsetY: native.clientY - r.top,
          });
        }
      };
      (chart as any).__moneytreeTreemapHandleNgxDbl = ngxDblHandler;

      const zr = chart.getZr();
      const zrHandler = (ze: unknown) => tryHitTiles(pickOffsets(ze));
      const prevZrHandler = (zr as any).__moneytreeTreemapDblZr as
        | ((ze: unknown) => void)
        | undefined;
      if (prevZrHandler) {
        zr.off('dblclick', prevZrHandler);
      }
      (zr as any).__moneytreeTreemapDblZr = zrHandler;
      zr.on('dblclick', zrHandler);

      const dom = chart.getDom() as HTMLElement | null;
      if (dom) {
        const prevDomCleanup = (chart as any).__moneytreeTreemapDomDblCleanup as (() => void) | undefined;
        prevDomCleanup?.();
        const onDomDbl = (mouseEv: MouseEvent) => {
          if (mouseEv.button !== 0) {
            return;
          }
          const r = dom.getBoundingClientRect();
          tryHitTiles({
            offsetX: mouseEv.clientX - r.left,
            offsetY: mouseEv.clientY - r.top,
          });
        };
        dom.addEventListener('dblclick', onDomDbl);
        const domCleanup = () => dom.removeEventListener('dblclick', onDomDbl);
        (chart as any).__moneytreeTreemapDomDblCleanup = domCleanup;
      }
    });

    return this;
  }

  /**
   * Set width and height for treemap
   */
  setSize(width: string | number, height: string | number): this {
    this.seriesOptions.width = width;
    this.seriesOptions.height = height;
    return this;
  }

  /**
   * Override build method to merge series options
   */
  override build(): IWidget {
    // Merge series options with chart options
    const finalOptions: TreemapChartOptions = {
      ...this.chartOptions,
      series: [{
        ...this.seriesOptions,
        type: 'treemap',
      }],
    };

    return this.widgetBuilder
      .setEChartsOptions(finalOptions)
      .build();
  }

  /**
   * Static method to update data on an existing treemap chart widget with enhanced retry mechanism
   */
  static override updateData(widget: IWidget, data: any, retryOptions?: { maxAttempts?: number; baseDelay?: number }): void {
    ApacheEchartBuilder.updateData(widget, data, retryOptions);
  }

  /**
   * Transform generic data array to treemap format
   */
  static transformToTreemapData(data: any[], options?: { 
    valueField?: string; 
    nameField?: string; 
    childrenField?: string;
    maxDepth?: number;
    minValue?: number;
  }): TreemapData[] {
    if (!data || data.length === 0) return [];

    const valueField = options?.valueField || 'value';
    const nameField = options?.nameField || 'name';
    const childrenField = options?.childrenField || 'children';
    const maxDepth = options?.maxDepth || 3;
    const minValue = options?.minValue || 0;

    const transformItem = (item: any, depth: number): TreemapData => {
      const transformed: TreemapData = {
        name: String(item[nameField]) || 'Unknown',
        value: Number(item[valueField]) || 0
      };

      // Filter out items below minimum value
      if (transformed.value < minValue) {
        return transformed;
      }

      // Process children if they exist and we haven't reached max depth
      if (depth < maxDepth && item[childrenField] && Array.isArray(item[childrenField])) {
        transformed.children = item[childrenField]
          .map((child: any) => transformItem(child, depth + 1))
          .filter((child: TreemapData) => child.value >= minValue);
      }

      return transformed;
    };

    return data.map(item => transformItem(item, 0));
  }

  /**
   * Create hierarchical data structure from flat array
   */
  static createHierarchyFromFlat(
    data: any[], 
    options: {
      idField: string;
      parentField: string;
      valueField: string;
      nameField: string;
    }
  ): TreemapData[] {
    const { idField, parentField, valueField, nameField } = options;
    const itemMap = new Map<any, TreemapData>();
    const rootItems: TreemapData[] = [];

    // Validate input data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return rootItems;
    }

    // First pass: create all items
    data.forEach(item => {
      // Validate item and required fields
      if (!item || item[idField] == null) {
        return; // Skip invalid items
      }

      const treeItem: TreemapData = {
        name: String(item[nameField]) || 'Unknown',
        value: Number(item[valueField]) || 0,
        children: []
      };
      itemMap.set(item[idField], treeItem);
    });

    // Second pass: build hierarchy
    data.forEach(item => {
      // Validate item and required fields
      if (!item || item[idField] == null) {
        return; // Skip invalid items
      }

      const treeItem = itemMap.get(item[idField]);
      if (!treeItem) return;

      const parentId = item[parentField];
      if (parentId != null && itemMap.has(parentId)) {
        const parent = itemMap.get(parentId);
        if (parent && parent.children) {
          parent.children.push(treeItem);
        }
      } else {
        rootItems.push(treeItem);
      }
    });

    return rootItems;
  }

  /**
   * Set financial display formatting
   */
  setFinancialDisplay(currencyCode: string = 'USD', locale: string = 'en-US'): this {
    this.setCurrencyFormatter(currencyCode, locale);
    
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    this.setLabelFormatter((params: any) => {
      return `${params.data.name}\n${formatter.format(params.data.value)}`;
    });

    return this;
  }

  /**
   * Set percentage display formatting
   */
  setPercentageDisplay(decimals: number = 1): this {
    this.setPercentageFormatter(decimals);
    
    this.setLabelFormatter((params: any) => {
      return `${params.data.name}\n${params.data.value.toFixed(decimals)}%`;
    });

    return this;
  }

  /**
   * Set zoom behavior configuration
   */
  setZoomBehavior(
    enableZoom: boolean = true, 
    nodeClick: 'zoomToNode' | 'link' | false = 'zoomToNode',
    roam: boolean = true
  ): this {
    this.setRoam(roam);
    if (nodeClick) {
      this.setNodeClick(nodeClick);
    }
    return this;
  }

  /**
   * Set enhanced drill-down animations and transitions
   */
  setDrillDownAnimations(): this {
    // Add animation configuration to chart options
    this.chartOptions.animationDuration = 1000;
    this.chartOptions.animationDurationUpdate = 1000;
    this.chartOptions.animationEasing = 'cubicInOut';
    this.chartOptions.animationEasingUpdate = 'quinticInOut';
    
    // Enable animation for treemap series
    this.seriesOptions.animation = true;
    this.seriesOptions.animationDuration = 1000;
    this.seriesOptions.animationDurationUpdate = 1000;
    this.seriesOptions.animationEasing = 'cubicInOut';
    this.seriesOptions.animationEasingUpdate = 'quinticInOut';
    
    return this;
  }

  /**
   * Set custom drill-down event handlers
   */
  setDrillDownEventHandlers(onDrillDown?: (params: any) => void, onBreadcrumbClick?: (params: any) => void): this {
    // Store event handlers in chart options for later use
    if (!this.chartOptions['customEventHandlers']) {
      this.chartOptions['customEventHandlers'] = {};
    }
    
    if (onDrillDown) {
      this.chartOptions['customEventHandlers'].onDrillDown = onDrillDown;
    }
    
    if (onBreadcrumbClick) {
      this.chartOptions['customEventHandlers'].onBreadcrumbClick = onBreadcrumbClick;
    }
    
    return this;
  }

  /**
   * Create portfolio distribution configuration with enhanced drill-down features
   */
  setPortfolioConfiguration(): this {
    return this
      .setBreadcrumb(true, 'bottom', '10%', '10%', '10%')
      .setItemStyle('#fff', 1, 1)
      .setLevels([
        {
          // Root level - macro categories
          itemStyle: { 
            borderColor: '#777', 
            borderWidth: 0, 
            gapWidth: 5,
            borderColorSaturation: 0.6
          },
          upperLabel: { show: false },
          label: { show: false }
        },
        {
          // First level - industries
          itemStyle: { 
            borderColor: '#555', 
            borderWidth: 5, 
            gapWidth: 1,
            borderColorSaturation: 0.7
          },
          label: { 
            show: true, 
            formatter: '{b}\n₹{c}',
            fontSize: 12,
            fontWeight: 'bold'
          }
        },
        {
          // Second level - sectors
          itemStyle: { 
            borderColor: '#333', 
            borderWidth: 5, 
            gapWidth: 1,
            borderColorSaturation: 0.8
          },
          label: { 
            show: true, 
            formatter: '{b}\n₹{c}',
            fontSize: 10
          }
        }
      ])
      .setEmphasis(10, 0, 'rgba(0, 0, 0, 0.5)')
      .setZoomBehavior(true, 'zoomToNode', true)
      .setDrillDownAnimations();
  }

  /**
   * Create expense breakdown configuration
   */
  setExpenseConfiguration(): this {
    return this
      .setBreadcrumb(true, '10%', '10%', '10%', '10%')
      .setItemStyle('#fff', 1, 1)
      .setLevels([
        {
          itemStyle: { borderColor: '#777', borderWidth: 0, gapWidth: 1 },
          label: { show: false }
        },
        {
          itemStyle: { borderColor: '#555', borderWidth: 5, gapWidth: 1 },
          label: { show: true, formatter: '{b}\n${c}K' }
        },
        {
          itemStyle: { borderColor: '#555', borderWidth: 5, gapWidth: 1 },
          label: { show: true, formatter: '{b}\n${c}K' }
        }
      ])
      .setEmphasis(10, 0, 'rgba(0, 0, 0, 0.5)')
      .setZoomBehavior(true, 'zoomToNode', true);
  }

  /**
   * Set filter column for data filtering
   */
  override setFilterColumn(column: string): this {
    this.filterColumn = column;
    return this;
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
   * Static method to check if a widget is a treemap chart
   */
  static isTreemapChart(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'treemap');
  }

  /**
   * Create a treemap chart widget with default configuration
   */
  static createTreemapChartWidget(data?: TreemapData[]): WidgetBuilder {
    const builder = new TreemapChartBuilder();
    if (data) {
      builder.setData(data);
    }
    return builder.widgetBuilder;
  }

  /**
   * Static method to export treemap data for Excel/CSV export
   */
  static override exportData(widget: IWidget): any[] {
    const chartOptions = widget['echartsOptions'];
    if (!chartOptions || !chartOptions.series || !chartOptions.series[0] || !chartOptions.series[0].data) {
      return [];
    }

    const data = chartOptions.series[0].data as TreemapData[];
    return this.flattenTreemapData(data);
  }

  /**
   * Static method to get headers for the exported data
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Name', 'Value', 'Level'];
  }

  /**
   * Static method to get sheet name for the exported data
   */
  static override getExportSheetName(widget: IWidget): string {
    return 'Treemap Data';
  }

  /**
   * Helper method to flatten treemap data for export
   */
  private static flattenTreemapData(data: TreemapData[], level: number = 0): any[] {
    const result: any[] = [];
    
    for (const item of data) {
      result.push({
        name: item.name,
        value: item.value,
        level: level,
      });
      
      if (item.children && item.children.length > 0) {
        result.push(...this.flattenTreemapData(item.children, level + 1));
      }
    }
    
    return result;
  }
}

/**
 * Convenience function to create a treemap chart widget
 */
export function createTreemapChartWidget(data?: TreemapData[]): WidgetBuilder {
  return TreemapChartBuilder.createTreemapChartWidget(data);
} 