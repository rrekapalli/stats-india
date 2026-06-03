import { IWidget } from '../../entities/IWidget';
import type { D3ChartHandle, D3ChartSpec } from '../../chart-spec';
import type { WidgetGridPosition } from '../../grid/dashboard-grid.types';
import { IState } from '../../entities/IState';
import { IFilterOptions } from '../../entities/IFilterOptions';
import { ITileOptions } from '../../entities/ITileOptions';
import { ITableOptions } from '../../entities/ITableOptions';
import { IFilterValues } from '../../entities/IFilterValues';

export interface WidgetDataExtractor {
  extractData(widget: IWidget): unknown[];
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
      options: { chartType: 'bar', series: [] } as D3ChartSpec,
    },
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

  setD3ChartSpec(options: D3ChartSpec) {
    this.widget.config.options = options;
    return this;
  }

  /** @deprecated Use setD3ChartSpec — kept for migrated ECharts builder call sites */
  setEChartsOptions(options: D3ChartSpec | Record<string, unknown>) {
    return this.setD3ChartSpec(options as D3ChartSpec);
  }

  setFilterOptions(options: IFilterOptions) {
    this.widget.config.options = options;
    return this;
  }

  setTileOptions(options: ITileOptions) {
    this.widget.config.options = options;
    return this;
  }

  setTableOptions(options: ITableOptions) {
    this.widget.config.options = options;
    return this;
  }

  setEvents(onChartOptions: (widget: IWidget, chart?: D3ChartHandle, filters?: string | IFilterValues[]) => void) {
    this.widget.config.events = { onChartOptions };
    return this;
  }

  setEventChartOptions(onChartOptions: (widget: IWidget, chart?: D3ChartHandle, filters?: string | IFilterValues[]) => void) {
    this.widget.config.events = { onChartOptions };
    return this;
  }

  setSeries(series: [{}]) {
    this.widget.series = series;
    return this;
  }

  setData(data: unknown) {
    this.widget.data = data;
    return this;
  }

  setChartInstance(chartInstance: D3ChartHandle | null) {
    this.widget.chartInstance = chartInstance;
    return this;
  }

  setHeightFromGridster(cellHeight: number = 30, margin: number = 10) {
    const rows = this.widget.position?.rows || this.widget.rows || 1;
    const minHeightPerRow = 50;
    const calculatedHeight = Math.max(rows * minHeightPerRow, rows * cellHeight + (rows - 1) * margin);
    this.widget.height = calculatedHeight;
    return this;
  }

  build() {
    return this.widget;
  }

  static setData(widget: IWidget, data: unknown): void {
    widget.data = data;
    const opts = widget.config.options;
    if (opts && typeof opts === 'object' && 'chartType' in opts) {
      const spec = opts as D3ChartSpec;
      if (spec.series?.[0]) {
        spec.series[0].data = Array.isArray(data) ? data : [data];
      }
      if (widget.chartInstance) {
        widget.chartInstance.update(spec);
      }
    }
    if (widget.config.component === 'table' && widget.config.options) {
      const tableOptions = widget.config.options as ITableOptions;
      if (tableOptions.data) {
        tableOptions.data = data as Record<string, unknown>[];
      }
    }
    if (widget.config.component === 'tile' && widget.config.options) {
      const tileOptions = widget.config.options as ITileOptions;
      if (data && typeof data === 'object') {
        Object.assign(tileOptions, data);
      }
    }
  }

  static exportTableData(widget: IWidget): unknown[] {
    const tableOptions = widget.config?.options as ITableOptions;
    if (!tableOptions?.data || !tableOptions?.columns) {
      return [];
    }
    return tableOptions.data.map((row) => tableOptions.columns.map((column) => row[column] ?? ''));
  }

  static getTableExportHeaders(widget: IWidget): string[] {
    const tableOptions = widget.config?.options as ITableOptions;
    return tableOptions?.columns || [];
  }

  static getTableExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Table';
    const cleanTitle = title.replace(/[^\w\s]/gi, '').substring(0, 20);
    return `${cleanTitle} (Table)`;
  }

  static exportTileData(widget: IWidget): unknown[] {
    const tileOptions = widget.config?.options as ITileOptions;
    if (!tileOptions) {
      return [];
    }
    return [
      [
        widget.config?.header?.title || 'Metric',
        tileOptions.value || '',
        tileOptions.change || '',
        tileOptions.changeType || 'neutral',
        tileOptions.description || '',
      ],
    ];
  }

  static getTileExportHeaders(): string[] {
    return ['Metric', 'Value', 'Change', 'Change Type', 'Description'];
  }

  static getTileExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Tile';
    const cleanTitle = title.replace(/[^\w\s]/gi, '').substring(0, 20);
    return `${cleanTitle} (Tile)`;
  }
}
