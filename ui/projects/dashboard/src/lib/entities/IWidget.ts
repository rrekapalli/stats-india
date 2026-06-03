import {ECharts, EChartsOption} from 'echarts';
import type { WidgetGridPosition } from '../grid/dashboard-grid.types';
import {IState} from './IState';
import {IFilterOptions} from './IFilterOptions';
import {ITileOptions} from './ITileOptions';
import {IMarkdownCellOptions} from './IMarkdownCellOptions';
import {ICodeCellOptions} from './ICodeCellOptions';
import {ITableOptions} from './ITableOptions';
import {IFilterValues} from './IFilterValues';
import {FilterBy} from '../echart-chart-builders/apache-echart-builder';

/**
 * Interface representing a widget in the dashboard
 */
export interface IWidget extends WidgetGridPosition {
  /** Unique identifier for the widget */
  id: string;
  
  /** Position and size configuration for the grid layout */
  position: WidgetGridPosition;
  
  /** Widget configuration object */
  config: {
    /** Component type identifier */
    component?: string;
    
    /** Initial state of the widget */
    initialState?: IState;
    
    /** Current state of the widget */
    state?: IState;
    
    /** Header configuration */
    header?: {
      /** Widget title */
      title: string;
      /** Available options for the widget header */
      options?: string[];
    };
    
    /** Size configuration [width, height] */
    size?: number[];
    
    /** Widget-specific options based on the component type */
    options: EChartsOption | IFilterOptions | ITileOptions | IMarkdownCellOptions | ICodeCellOptions | ITableOptions;
    
    /** Data accessor key for retrieving values */
    accessor?: string;
    
    /** Filter column/property to use when applying filters (falls back to accessor if not specified) */
    filterColumn?: string;
    
    /** How to filter when this widget is clicked: by value or by category */
    filterBy?: FilterBy;
    
    /** Event handlers */
    events?: {
      /** Callback function when chart options change
       * @param widget - The current widget instance
       * @param chart - Optional ECharts instance
       * @param filters - Optional filter values
       */
      onChartOptions?: (widget: IWidget, chart?: ECharts, filters?: string | IFilterValues[]) => void 
    };

    /** Table height in vh for stock-list-table (e.g. 62 stock-insights, 72 overall) */
    tableHeightVh?: number;
    /** When true, stock-list table/ag-grid uses height 100% of the gridster cell instead of tableHeightVh */
    stockListTableFillParent?: boolean;

    /**
     * PrimeNG client-side table: max visible body rows (scroll the rest).
     * Use with stockListTableFillParent to avoid vh-based heights extending past the app shell.
     */
    stockListBodyMaxRows?: number;
    /** Row height unit for stockListBodyMaxRows cap (rem); default applied in component SCSS if unset */
    stockListBodyRowRem?: number;

    /** Load rows via POST /v1/instruments/filtered (Stock Insights). */
    stockListUseFilteredApi?: boolean;
    /** If true with stockListUseFilteredApi, use ag-grid infinite scroll; otherwise PrimeNG table + same POST API. */
    stockListUseAgGrid?: boolean;

    /** Symbol column navigates to `/stock-insights/:symbol/:tab` (default tab `overview` → `/stock-insights/:symbol/overview`). */
    symbolDeepLink?: boolean;
    /** Base path before symbol (default `/stock-insights`). */
    symbolDeepLinkBasePath?: string;
    /** Tab slug after symbol in deep links (default `overview`). */
    symbolDeepLinkDetailTab?: string;
  };
  
  /** Data series for the widget */
  series?: [{}];
  
  /** Dynamic data for the widget that can be updated via API calls */
  data?: any;
  
  /** Reference to the ECharts instance if applicable */
  chartInstance?: ECharts | null;
  /** Legacy alias for chart instance (e.g. stock-list-chart-builder) */
  chart?: ECharts | null;
  /** Widget type identifier (legacy) */
  type?: string;
  /** Chart type (legacy) */
  chartType?: string;
  /** Display title (legacy) */
  title?: string;

  /** Optional height of the widget */
  height?: number;

  /** Method to update widget data dynamically */
  setData?(data: any): void;

  /** Legacy dynamic keys (e.g. echart_options, chartOptions) used by chart builders */
  [key: string]: any;
}
