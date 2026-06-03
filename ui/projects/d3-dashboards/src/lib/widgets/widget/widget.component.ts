import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { NgComponentOutlet, CommonModule } from '@angular/common';
import { IWidget } from '../../entities/IWidget';
import { D3ChartComponent } from '../d3-chart/d3-chart.component';
import { FilterComponent } from '../filter/filter.component';
import { TableComponent } from '../table/table.component';
import { TileComponent } from '../tile/tile.component';
import { StockTileComponent } from '../stock-tile/stock-tile.component';
import { StockListTableComponent } from '../../d3-chart-builders/stock-list/stock-list-table.component';
import { PricePerformanceStripComponent } from '../price-performance-strip/price-performance-strip.component';
import { PeerMetricsBarComponent } from '../peer-metrics-bar/peer-metrics-bar.component';
import { ITableOptions } from '../../entities/ITableOptions';
import type { D3ChartSpec } from '../../chart-spec';

const onGetWidget = (widget: IWidget) => {
  switch (widget?.config?.component) {
    case 'd3chart':
      return D3ChartComponent;
    case 'filter':
      return FilterComponent;
    case 'table':
      return TableComponent;
    case 'tile':
      return TileComponent;
    case 'stock-tile':
      return StockTileComponent;
    case 'stock-list-table':
      return StockListTableComponent;
    case 'price-performance-strip':
      return PricePerformanceStripComponent;
    case 'peer-metrics-bar':
      return PeerMetricsBarComponent;
    default:
      return D3ChartComponent;
  }
};

@Component({
  selector: 'vis-d3-widget',
  standalone: true,
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
  imports: [
    CommonModule,
    NgComponentOutlet,
    D3ChartComponent,
    FilterComponent,
    StockListTableComponent,
    PricePerformanceStripComponent,
    PeerMetricsBarComponent,
  ],
})
export class WidgetComponent implements OnChanges {
  @Input() widget!: IWidget;
  @Input() viewMode: 'chart' | 'table' = 'chart';
  @Output() onDataLoad: EventEmitter<IWidget> = new EventEmitter();
  @Output() onUpdateFilter: EventEmitter<unknown> = new EventEmitter();
  @Output() onStockSelected: EventEmitter<unknown> = new EventEmitter();
  @Output() onStockDoubleClicked: EventEmitter<unknown> = new EventEmitter();

  get isStockListTable(): boolean {
    return this.widget?.config?.component === 'stock-list-table';
  }

  get isPerformanceStrip(): boolean {
    return this.widget?.config?.component === 'price-performance-strip';
  }

  get isPeerMetricsBar(): boolean {
    return this.widget?.config?.component === 'peer-metrics-bar';
  }

  get isFilterWidget(): boolean {
    return this.widget?.config?.component === 'filter';
  }

  get isD3Chart(): boolean {
    return this.isD3ChartComponent && this.viewMode === 'chart';
  }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['widget'] && !changes['widget'].firstChange) {
      this.cdr.markForCheck();
    }
  }

  private originalWidget: IWidget | null = null;
  private tableWidget: IWidget | null = null;
  private cachedCurrentWidget: { component: any; inputs: Record<string, unknown> } | null = null;
  private lastWidgetId: string | null = null;
  private lastViewMode: string | null = null;

  get currentWidget() {
    const currentWidgetId = this.widget?.id;
    const currentViewMode = this.viewMode;

    if (this.cachedCurrentWidget && this.lastWidgetId === currentWidgetId && this.lastViewMode === currentViewMode) {
      return this.cachedCurrentWidget;
    }

    const widgetToRender = this.getWidgetForCurrentMode();
    this.cachedCurrentWidget = {
      component: onGetWidget(widgetToRender),
      inputs: {
        widget: widgetToRender,
        onDataLoad: this.onDataLoad,
        onUpdateFilter: this.onUpdateFilter,
        stockSelected: this.onStockSelected,
        stockDoubleClicked: this.onStockDoubleClicked,
      },
    };

    this.lastWidgetId = currentWidgetId ?? null;
    this.lastViewMode = currentViewMode;

    return this.cachedCurrentWidget;
  }

  get isD3ChartComponent(): boolean {
    return onGetWidget(this.getWidgetForCurrentMode()) === D3ChartComponent;
  }

  private getWidgetForCurrentMode(): IWidget {
    if (this.viewMode === 'table') {
      return this.getTableWidget();
    }
    return this.getOriginalWidget();
  }

  private getOriginalWidget(): IWidget {
    if (!this.originalWidget) {
      this.originalWidget = { ...this.widget };
    }
    return this.originalWidget;
  }

  private getTableWidget(): IWidget {
    if (!this.tableWidget) {
      this.tableWidget = this.createTableWidget();
    }
    return this.tableWidget;
  }

  private createTableWidget(): IWidget {
    const originalWidget = this.getOriginalWidget();
    const dataExtractor = this.getDataExtractor(originalWidget);

    let columns: string[] = [];
    let data: Record<string, unknown>[] = [];

    if (dataExtractor) {
      columns = dataExtractor.getHeaders(originalWidget);
      const rawData = dataExtractor.extractData(originalWidget) as unknown[][];
      data = rawData.map((row) => {
        const rowObj: Record<string, unknown> = {};
        columns.forEach((col, colIndex) => {
          rowObj[col] = row[colIndex] ?? '';
        });
        return rowObj;
      });
    } else {
      columns = ['Property', 'Value'];
      data = [
        { Property: 'Widget ID', Value: originalWidget.id },
        { Property: 'Component Type', Value: originalWidget.config?.component || 'Unknown' },
        { Property: 'Title', Value: originalWidget.config?.header?.title || 'Untitled' },
      ];
    }

    return {
      ...originalWidget,
      config: {
        ...originalWidget.config,
        component: 'table',
        options: { columns, data } as ITableOptions,
      },
    };
  }

  private getDataExtractor(widget: IWidget): {
    extractData: (w: IWidget) => unknown[][];
    getHeaders: (w: IWidget) => string[];
    getSheetName: (w: IWidget) => string;
  } | null {
    const component = widget.config?.component;
    if (component === 'd3chart') {
      const chartType = this.getChartType(widget);
      if (chartType) {
        return this.getChartDataExtractor(chartType);
      }
    } else if (component === 'table') {
      return {
        extractData: (w) => {
          const opts = w.config?.options as ITableOptions;
          return (opts?.data ?? []).map((row) => opts.columns.map((c) => row[c] ?? ''));
        },
        getHeaders: (w) => (w.config?.options as ITableOptions)?.columns ?? [],
        getSheetName: (w) => this.getWidgetSheetName(w, 'Table'),
      };
    } else if (component === 'tile') {
      return {
        extractData: (w) => {
          const options = w.config?.options as { value?: string; change?: string; changeType?: string; description?: string };
          return [[options?.value ?? '', options?.change ?? '', options?.changeType ?? '', options?.description ?? '']];
        },
        getHeaders: () => ['Value', 'Change', 'Type', 'Description'],
        getSheetName: (w) => this.getWidgetSheetName(w, 'Tile'),
      };
    }
    return this.getGenericDataExtractor();
  }

  private getChartType(widget: IWidget): string | null {
    if (widget.config?.component === 'd3chart') {
      return (widget.config.options as D3ChartSpec)?.chartType ?? null;
    }
    return null;
  }

  private getChartDataExtractor(chartType: string) {
    switch (chartType) {
      case 'pie':
        return {
          extractData: (w: IWidget) => {
            const series = (w.config.options as D3ChartSpec).series?.[0];
            const pts = (series?.data ?? []) as { name?: string; value?: number }[];
            return pts.map((item) => [
              item.name ?? 'Unknown',
              item.value ?? 0,
              this.calculatePercentage(item.value ?? 0, pts),
            ]);
          },
          getHeaders: () => ['Category', 'Value', 'Percentage'],
          getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'PieChart'),
        };
      case 'bar':
        return {
          extractData: (w: IWidget) => {
            const spec = w.config.options as D3ChartSpec;
            const cats = spec.categories ?? [];
            const data = (spec.series?.[0]?.data ?? []) as { name?: string; value?: number }[] | number[];
            return data.map((item, index) => {
              if (typeof item === 'object' && item !== null) {
                return [item.name ?? cats[index] ?? `Category ${index + 1}`, item.value ?? 0];
              }
              return [cats[index] ?? `Category ${index + 1}`, item];
            });
          },
          getHeaders: () => ['Category', 'Value'],
          getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'BarChart'),
        };
      default:
        return this.getGenericDataExtractor();
    }
  }

  private getGenericDataExtractor() {
    return {
      extractData: (w: IWidget) => {
        const data: unknown[][] = [];
        data.push(['Widget ID', w.id]);
        data.push(['Component Type', w.config?.component || 'Unknown']);
        data.push(['Title', w.config?.header?.title || 'Untitled']);
        return data;
      },
      getHeaders: () => ['Property', 'Value'],
      getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'Widget'),
    };
  }

  private getWidgetSheetName(widget: IWidget, prefix: string): string {
    const title = widget.config?.header?.title || widget.id;
    return `${prefix}_${title}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 31);
  }

  private calculatePercentage(value: number, data: { value?: number }[]): string {
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    if (total === 0) {
      return '0%';
    }
    return `${((value / total) * 100).toFixed(1)}%`;
  }
}
