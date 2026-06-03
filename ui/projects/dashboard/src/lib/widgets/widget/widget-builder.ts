import { IWidget } from '../../entities/IWidget';
import { ECharts, EChartsOption } from 'echarts';
import type { WidgetGridPosition } from '../../grid/dashboard-grid.types';
import { IState } from '../../entities/IState';
import { IFilterOptions } from '../../entities/IFilterOptions';
import { ITileOptions } from '../../entities/ITileOptions';
import { IMarkdownCellOptions } from '../../entities/IMarkdownCellOptions';
import { ICodeCellOptions } from '../../entities/ICodeCellOptions';
import { ITableOptions } from '../../entities/ITableOptions';
import { IFilterValues } from '../../entities/IFilterValues';

export interface WidgetDataExtractor {
  extractData(widget: IWidget): any[];
  getHeaders(widget: IWidget): string[];
  getSheetName(widget: IWidget): string;
}

export class WidgetBuilder {
  private widget: IWidget = {
    id: '',
    x: 0,
    y: 0,
    cols: 1,
    rows: 1,
    position: { x: 0, y: 0, cols: 1, rows: 1 },
    config: {
      options: {}
    }
  };

  setId(id: string) {
    this.widget.id = id;
    return this;
  }

  setPosition(position: WidgetGridPosition) {
    this.widget.position = position;
    this.widget.x = position.x;
    this.widget.y = position.y;
    this.widget.cols = position.cols;
    this.widget.rows = position.rows;
    return this;
  }

  setComponent(component: string) {
    this.widget.config.component = component;
    return this;
  }

  setInitialState(initialState: IState) {
    this.widget.config.initialState = initialState;
    return this;
  }

  setState(state: IState) {
    this.widget.config.state = state;
    return this;
  }

  setHeader(title: string, options?: string[]) {
    this.widget.config.header = { title, options };
    return this;
  }

  setSize(size: number[]) {
    this.widget.config.size = size;
    return this;
  }

  setEChartsOptions(options: EChartsOption | any) {
    this.widget.config.options = options;
    return this;
  }

  setFilterOptions(options: IFilterOptions) {
    this.widget.config.options = options;
    return this;
  }

  setTileOptions(options: ITileOptions) {
    this.widget.config.options = options;
    return this;
  }

  setMarkdownCellOptions(options: IMarkdownCellOptions) {
    this.widget.config.options = options;
    return this;
  }

  setCodeCellOptions(options: ICodeCellOptions) {
    this.widget.config.options = options;
    return this;
  }

  setTableOptions(options: ITableOptions) {
    this.widget.config.options = options;
    return this;
  }

  setEvents(onChartOptions: (widget: IWidget, chart?: ECharts, filters?: string | IFilterValues[]) => void) {
    this.widget.config.events = { onChartOptions };
    return this;
  }

  setEventChartOptions(onChartOptions: (widget: IWidget, chart?: ECharts, filters?: string | IFilterValues[]) => void) {
    this.widget.config.events = { onChartOptions };
    return this;
  }

  setSeries(series: [{}]) {
    this.widget.series = series;
    return this;
  }

  setData(data: any) {
    this.widget.data = data;
    return this;
  }

  setChartInstance(chartInstance: ECharts | null) {
    this.widget.chartInstance = chartInstance;
    return this;
  }

  /**
   * Set widget height based on gridster item dimensions
   * @param cellHeight - Height of each gridster cell (default: 30px)
   * @param margin - Margin between cells (default: 10px)
   */
  setHeightFromGridster(cellHeight: number = 30, margin: number = 10) {
    // Calculate height based on rows: (rows * cellHeight) + ((rows - 1) * margin)
    const rows = this.widget.position?.rows || this.widget.rows || 1;
    
    // For a 12-row widget, we want a much larger height
    // Let's use a more reasonable calculation: rows * 50px (minimum) with some padding
    const minHeightPerRow = 50;
    const calculatedHeight = Math.max(rows * minHeightPerRow, rows * cellHeight + (rows - 1) * margin);
    
    this.widget.height = calculatedHeight;
    
    
    return this;
  }

  setEChartsTitle(title: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).title = title;
    return this;
  }

  setEChartsGrid(grid: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).grid = grid;
    return this;
  }

  setEChartsTooltip(tooltip: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).tooltip = tooltip;
    return this;
  }

  setEChartsLegend(legend: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).legend = legend;
    return this;
  }

  setEChartsXAxis(xAxis: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).xAxis = xAxis;
    return this;
  }

  setEChartsYAxis(yAxis: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).yAxis = yAxis;
    return this;
  }

  setEChartsSeries(series: any) {
    if (!this.widget.config.options) {
      this.widget.config.options = {};
    }
    (this.widget.config.options as EChartsOption).series = series;
    return this;
  }

  build() {
    return this.widget;
  }

  /**
   * Static method to update data on an existing widget
   * @param widget - The widget to update
   * @param data - The new data to set
   */
  static setData(widget: IWidget, data: any): void {
    widget.data = data;
    
    // Update ECharts series data if it's an ECharts widget
    if (widget.config.options && 'series' in widget.config.options) {
      const options = widget.config.options as EChartsOption;
      if (options.series && Array.isArray(options.series)) {
        options.series.forEach(series => {
          if (series && typeof series === 'object' && 'data' in series) {
            (series as any).data = data;
          }
        });
      }
      
      // Trigger chart update if chart instance exists
      if (widget.chartInstance) {
        widget.chartInstance.setOption(options);
      }
    }
    
    // Update table data if it's a table widget
    if (widget.config.component === 'table' && widget.config.options) {
      const tableOptions = widget.config.options as ITableOptions;
      if (tableOptions.data) {
        tableOptions.data = data;
      }
    }
    
    // Update tile data if it's a tile widget
    if (widget.config.component === 'tile' && widget.config.options) {
      const tileOptions = widget.config.options as ITileOptions;
      if (data && typeof data === 'object') {
        Object.assign(tileOptions, data);
      }
    }
  }

  /**
   * Export table widget data for Excel/CSV
   */
  static exportTableData(widget: IWidget): any[] {
    const tableOptions = widget.config?.options as ITableOptions;
    if (!tableOptions?.data || !tableOptions?.columns) return [];

    return tableOptions.data.map(row => 
      tableOptions.columns.map(column => row[column] || '')
    );
  }

  /**
   * Get headers for table widget export
   */
  static getTableExportHeaders(widget: IWidget): string[] {
    const tableOptions = widget.config?.options as ITableOptions;
    return tableOptions?.columns || [];
  }

  /**
   * Get sheet name for table widget export
   */
  static getTableExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Table';
    const cleanTitle = title.replace(/[^\w\s]/gi, '').substring(0, 20);
    return `${cleanTitle} (Table)`;
  }

  /**
   * Export tile widget data for Excel/CSV
   */
  static exportTileData(widget: IWidget): any[] {
    const tileOptions = widget.config?.options as ITileOptions;
    if (!tileOptions) return [];

    return [[
      widget.config?.header?.title || 'Metric',
      tileOptions.value || '',
      tileOptions.change || '',
      tileOptions.changeType || 'neutral',
      tileOptions.description || ''
    ]];
  }

  /**
   * Get headers for tile widget export
   */
  static getTileExportHeaders(widget: IWidget): string[] {
    return ['Metric', 'Value', 'Change', 'Change Type', 'Description'];
  }

  /**
   * Get sheet name for tile widget export
   */
  static getTileExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Tile';
    const cleanTitle = title.replace(/[^\w\s]/gi, '').substring(0, 20);
    return `${cleanTitle} (Tile)`;
  }
}
    