import type { WidgetGridPosition } from '../grid/dashboard-grid.types';
import { IState } from './IState';
import { IFilterOptions } from './IFilterOptions';
import { ITileOptions } from './ITileOptions';
import { ITableOptions } from './ITableOptions';
import { IFilterValues } from './IFilterValues';
import { FilterBy } from '../d3-chart-builders/d3-chart-builder';
import type { ChartRenderMode, D3ChartHandle, D3ChartSpec } from '../chart-spec';

/**
 * Interface representing a widget in the d3-dashboards grid.
 */
export interface IWidget extends WidgetGridPosition {
  id: string;
  position: WidgetGridPosition;
  config: {
    component?: string;
    renderMode?: ChartRenderMode;
    initialState?: IState;
    state?: IState;
    header?: {
      title: string;
      options?: string[];
    };
    size?: number[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any;
    accessor?: string;
    filterColumn?: string;
    filterBy?: FilterBy;
    events?: {
      onChartOptions?: (widget: IWidget, chart?: D3ChartHandle, filters?: string | IFilterValues[]) => void;
    };
    tableHeightVh?: number;
    stockListTableFillParent?: boolean;
    stockListBodyMaxRows?: number;
    stockListBodyRowRem?: number;
    stockListUseFilteredApi?: boolean;
    stockListUseAgGrid?: boolean;
    symbolDeepLink?: boolean;
    symbolDeepLinkBasePath?: string;
    symbolDeepLinkDetailTab?: string;
    /** Double-click opens bank statement drill-down (handled by host feature). */
    bankNavigationOnDblClick?: boolean;
    skipDefaultFiltering?: boolean;
  };
  series?: [{}];
  data?: any;
  chartInstance?: D3ChartHandle | null;
  chart?: D3ChartHandle | null;
  type?: string;
  chartType?: string;
  title?: string;
  height?: number;
  setData?(data: unknown): void;
  [key: string]: unknown;
}
