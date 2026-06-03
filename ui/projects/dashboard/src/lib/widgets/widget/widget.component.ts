import {Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ChangeDetectorRef} from '@angular/core';
import {NgComponentOutlet, CommonModule} from '@angular/common';
import {provideEchartsCore} from 'ngx-echarts';
import {IWidget} from '../../entities/IWidget';
import {EchartComponent} from '../echarts/echart.component';
import {FilterComponent} from '../filter/filter.component';
import {TableComponent} from '../table/table.component';
import {TileComponent} from '../tile/tile.component';
import {StockTileComponent} from '../stock-tile/stock-tile.component';
import {MarkdownCellComponent} from '../markdown-cell/markdown-cell.component';
import {CodeCellComponent} from '../code-cell/code-cell.component';
import {StockListTableComponent} from '../../echart-chart-builders/stock-list/stock-list-table.component';
import {PricePerformanceStripComponent} from '../price-performance-strip/price-performance-strip.component';
import {PeerMetricsBarComponent} from '../peer-metrics-bar/peer-metrics-bar.component';
import {ITableOptions} from '../../entities/ITableOptions';

/**
 * Factory function to determine the appropriate component based on widget type
 * @param widget - Widget configuration to determine component for
 * @returns Component class to render
 */
const onGetWidget = (widget: IWidget) => {
  switch (widget?.config?.component) {
    case 'echart':
      return EchartComponent;
    case 'filter':
      return FilterComponent;
    case 'table':
      return TableComponent;
    case 'tile':
      return TileComponent;
    case 'stock-tile':
      return StockTileComponent;
    case 'markdownCell':
      return MarkdownCellComponent;
    case 'codeCell':
      return CodeCellComponent;
    case 'stock-list-table':
      return StockListTableComponent;
    case 'price-performance-strip':
      return PricePerformanceStripComponent;
    case 'peer-metrics-bar':
      return PeerMetricsBarComponent;
    default:
      return EchartComponent;
  }
};

/**
 * Generic widget component that dynamically renders different widget types
 * based on the widget configuration. Supports echart, filter, table, tile,
 * markdown cell, and code cell components.
 */
@Component({
  selector: 'vis-widget',
  standalone: true,
  templateUrl:'./widget.component.html',
  styleUrls: ['./widget.component.scss'],
  imports: [CommonModule, NgComponentOutlet, StockListTableComponent, PricePerformanceStripComponent, PeerMetricsBarComponent],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts'),
    })
  ]
})
export class WidgetComponent implements OnChanges {
  /** Widget configuration to render */
  @Input() widget!: IWidget;
  
  /** Current view mode for the widget */
  @Input() viewMode: 'chart' | 'table' = 'chart';
  
  /** Event emitted when widget data is loaded */
  @Output() onDataLoad: EventEmitter<IWidget> = new EventEmitter();
  
  /** Event emitted when filter is updated */
  @Output() onUpdateFilter: EventEmitter<any> = new EventEmitter();
  
  /** Event emitted when stock is selected (for stock list widgets) */
  // CRITICAL: Keep event emitters as instance properties (not recreated)
  @Output() onStockSelected: EventEmitter<any> = new EventEmitter();
  
  /** Event emitted when stock is double-clicked (for stock list widgets) */
  @Output() onStockDoubleClicked: EventEmitter<any> = new EventEmitter();
  
  /**
   * Check if this is a stock list table widget
   * CRITICAL: Cache this to prevent unnecessary component recreation
   */
  get isStockListTable(): boolean {
    return this.widget?.config?.component === 'stock-list-table';
  }

  get isPerformanceStrip(): boolean {
    return this.widget?.config?.component === 'price-performance-strip';
  }

  get isPeerMetricsBar(): boolean {
    return this.widget?.config?.component === 'peer-metrics-bar';
  }
  
  constructor(private cdr: ChangeDetectorRef) {}
  
  /**
   * CRITICAL: Detect changes to widget data to ensure child components update properly
   * This is especially important for stock-list-table component with OnPush strategy
   */
  ngOnChanges(changes: SimpleChanges): void {
    // When widget data changes, ensure change detection propagates to child components
    if (changes['widget'] && !changes['widget'].firstChange) {
      // Widget data was updated - ensure child components detect the change
      this.cdr.markForCheck();
    }
  }

  private originalWidget: IWidget | null = null;
  private tableWidget: IWidget | null = null;
  private cachedCurrentWidget: any = null;
  private lastWidgetId: string | null = null;
  private lastViewMode: string | null = null;

  /**
   * Get the current widget configuration for dynamic component rendering
   * @returns Object containing component class and input properties
   */
  get currentWidget() {
    // Check if we need to update the cache
    const currentWidgetId = this.widget?.id;
    const currentViewMode = this.viewMode;
    
    if (this.cachedCurrentWidget && 
        this.lastWidgetId === currentWidgetId && 
        this.lastViewMode === currentViewMode) {
      return this.cachedCurrentWidget;
    }
    
    // Update cache
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
    
    this.lastWidgetId = currentWidgetId;
    this.lastViewMode = currentViewMode;
    
    return this.cachedCurrentWidget;
  }

  /**
   * Check if the current widget is an ECharts component
   * @returns True if the widget is an ECharts component
   */
  get isEchartComponent(): boolean {
    const widgetToRender = this.getWidgetForCurrentMode();
    return onGetWidget(widgetToRender) === EchartComponent;
  }

  /**
   * Get the widget configuration based on current view mode
   * @returns Widget configuration for current mode
   */
  private getWidgetForCurrentMode(): IWidget {
    if (this.viewMode === 'table') {
      return this.getTableWidget();
    } else {
      return this.getOriginalWidget();
    }
  }

  /**
   * Get the original widget configuration
   * @returns Original widget configuration
   */
  private getOriginalWidget(): IWidget {
    if (!this.originalWidget) {
      this.originalWidget = { ...this.widget };
    }
    return this.originalWidget;
  }

  /**
   * Get or create table widget configuration
   * @returns Table widget configuration
   */
  private getTableWidget(): IWidget {
    if (!this.tableWidget) {
      this.tableWidget = this.createTableWidget();
    }
    return this.tableWidget;
  }

  /**
   * Create table widget configuration from chart data
   * @returns Table widget configuration
   */
  private createTableWidget(): IWidget {
    const originalWidget = this.getOriginalWidget();
    const dataExtractor = this.getDataExtractor(originalWidget);
    
    let columns: string[] = [];
    let data: any[] = [];

    if (dataExtractor) {
      columns = dataExtractor.getHeaders(originalWidget);
      const rawData = dataExtractor.extractData(originalWidget);
      
      // Convert array data to object format for table
      data = rawData.map((row: any[], index: number) => {
        const rowObj: any = {};
        columns.forEach((col: string, colIndex: number) => {
          rowObj[col] = row[colIndex] || '';
        });
        return rowObj;
      });
    } else {
      // Fallback for unsupported widget types
      columns = ['Property', 'Value'];
      data = [
        { 'Property': 'Widget ID', 'Value': originalWidget.id },
        { 'Property': 'Component Type', 'Value': originalWidget.config?.component || 'Unknown' },
        { 'Property': 'Title', 'Value': originalWidget.config?.header?.title || 'Untitled' }
      ];
    }

    const tableOptions: ITableOptions = {
      columns,
      data
    };

    return {
      ...originalWidget,
      config: {
        ...originalWidget.config,
        component: 'table',
        options: tableOptions
      }
    };
  }

  /**
   * Get data extractor for widget type
   * @param widget - Widget to get extractor for
   * @returns Data extractor or null
   */
  private getDataExtractor(widget: IWidget): any {
    const component = widget.config?.component;
    
    // Handle different widget types
    if (component === 'echart') {
      const chartType = this.getChartType(widget);
      if (chartType) {
        return this.getChartDataExtractor(chartType);
      }
    } else if (component === 'table') {
      return {
        extractData: (w: IWidget) => (w.config?.options as any)?.data || [],
        getHeaders: (w: IWidget) => (w.config?.options as any)?.columns || [],
        getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'Table')
      };
    } else if (component === 'tile') {
      return {
        extractData: (w: IWidget) => {
          const options = w.config?.options as any;
          return [[
            options?.value || '',
            options?.change || '',
            options?.changeType || '',
            options?.description || ''
          ]];
        },
        getHeaders: () => ['Value', 'Change', 'Type', 'Description'],
        getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'Tile')
      };
    } else {
      return this.getGenericDataExtractor();
    }
  }

  /**
   * Get chart type from widget configuration
   * @param widget - Widget to get chart type from
   * @returns Chart type string or null
   */
  private getChartType(widget: IWidget): string | null {
    if (widget.config?.component === 'echart' && 
        (widget.config?.options as any)?.series?.[0]?.type) {
      return (widget.config.options as any).series[0].type;
    }
    return null;
  }

  /**
   * Get chart data extractor based on chart type
   * @param chartType - Type of chart
   * @returns Data extractor or null
   */
  private getChartDataExtractor(chartType: string): any {
    switch (chartType) {
      case 'pie':
        return {
          extractData: (w: IWidget) => {
            const series = (w.config?.options as any)?.series?.[0];
            if (!series?.data) return [];
            return series.data.map((item: any) => [
              item.name || 'Unknown',
              item.value || 0,
              this.calculatePercentage(item.value, series.data)
            ]);
          },
          getHeaders: () => ['Category', 'Value', 'Percentage'],
          getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'PieChart')
        };
      case 'bar':
        return {
          extractData: (w: IWidget) => {
            const series = (w.config?.options as any)?.series?.[0];
            const xAxis = (w.config?.options as any)?.xAxis;
            
            if (!series?.data) return [];
            
            // Handle different xAxis structures
            let categories: string[] = [];
            if (xAxis) {
              if (Array.isArray(xAxis)) {
                categories = xAxis[0]?.data || [];
              } else if (xAxis.data) {
                categories = xAxis.data;
              }
            }
            
            // If no categories found, create default ones
            if (categories.length === 0) {
              categories = series.data.map((_: any, index: number) => `Category ${index + 1}`);
            }
            
            return series.data.map((value: any, index: number) => [
              categories[index] || `Category ${index + 1}`,
              value || 0
            ]);
          },
          getHeaders: () => ['Category', 'Value'],
          getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'BarChart')
        };
      case 'line':
        return {
          extractData: (w: IWidget) => {
            const series = (w.config?.options as any)?.series;
            const xAxis = (w.config?.options as any)?.xAxis;
            
            if (!series || series.length === 0) return [];
            
            // Handle different xAxis structures
            let categories: string[] = [];
            if (xAxis) {
              if (Array.isArray(xAxis)) {
                categories = xAxis[0]?.data || [];
              } else if (xAxis.data) {
                categories = xAxis.data;
              }
            }
            
            // If no categories found, create default ones
            if (categories.length === 0 && series[0]?.data) {
              categories = series[0].data.map((_: any, index: number) => `Point ${index + 1}`);
            }
            
            const data: any[] = [];
            series.forEach((s: any, index: number) => {
              if (s.data) {
                s.data.forEach((value: any, pointIndex: number) => {
                  if (index === 0) {
                    data[pointIndex] = [categories[pointIndex] || `Point ${pointIndex + 1}`];
                  }
                  if (data[pointIndex]) {
                    data[pointIndex].push(value || 0);
                  }
                });
              }
            });
            return data;
          },
          getHeaders: (w: IWidget) => {
            const series = (w.config?.options as any)?.series;
            if (!series || series.length === 0) return ['Category'];
            return ['Category', ...series.map((s: any) => s.name || 'Series')];
          },
          getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'LineChart')
        };
      case 'scatter':
        return {
          extractData: (w: IWidget) => {
            const series = (w.config?.options as any)?.series?.[0];
            if (!series?.data) return [];
            return series.data.map((item: any) => [
              item.name || 'Point',
              Array.isArray(item.value) ? item.value[0] || 0 : item.value || 0,
              Array.isArray(item.value) ? item.value[1] || 0 : ''
            ]);
          },
          getHeaders: () => ['Name', 'X', 'Y'],
          getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'ScatterChart')
        };
      default:
        return this.getGenericDataExtractor();
    }
  }

  /**
   * Get generic data extractor for unsupported widget types
   * @returns Generic data extractor
   */
  private getGenericDataExtractor(): any {
    return {
      extractData: (w: IWidget) => {
        const data: any[] = [];
        data.push(['Widget ID', w.id]);
        data.push(['Component Type', w.config?.component || 'Unknown']);
        data.push(['Title', w.config?.header?.title || 'Untitled']);
        
        if (w.config?.options) {
          const options = w.config.options as any;
          Object.keys(options).forEach(key => {
            if (typeof options[key] !== 'object' || options[key] === null) {
              data.push([key, options[key]]);
            }
          });
        }
        
        if (w.series && w.series.length > 0) {
          data.push(['Series Data', JSON.stringify(w.series)]);
        }
        
        return data;
      },
      getHeaders: () => ['Property', 'Value'],
      getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'Widget')
    };
  }

  /**
   * Get widget sheet name for export
   * @param widget - Widget configuration
   * @param prefix - Sheet name prefix
   * @returns Sheet name
   */
  private getWidgetSheetName(widget: IWidget, prefix: string): string {
    const title = widget.config?.header?.title || widget.id;
    return `${prefix}_${title}`.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 31);
  }

  /**
   * Calculate percentage for pie charts
   * @param value - Current value
   * @param data - All data points
   * @returns Percentage string
   */
  private calculatePercentage(value: number, data: any[]): string {
    const total = data.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }
}
