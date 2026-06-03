// Components
export * from './lib/mt-action-dialog/mt-action-dialog.constants';
export * from './lib/mt-action-dialog/mt-action-dialog.component';
export * from './lib/widgets/widget/widget-builder';
export * from './lib/dashboard-container/dashboard-container.component';
export * from './lib/dashboard-header';
export * from './lib/widget-header/widget-header.component';
export * from './lib/widget-config/widget-config.component';

// Dashboard Container Builders
export * from './lib/dashboard-container';

// Dashboard Constants
export * from './lib/dashboard-container/dashboard-constants';

// KTD grid shell types (replaces legacy Gridster config for consumers)
export * from './lib/grid/dashboard-grid.types';

// Chart theme helpers (ECharts graphic / axis colors aligned with --mt-chart-*)
export * from './lib/theme/chart-ui-colors';

// Services
export * from './lib/services/excel-export.service';
export * from './lib/services/filter.service';

// Examples (omitted from package entry — paths/APIs drift; use specs/docs for patterns)

// Config


// Entities
export * from './lib/entities/ICodeCellOptions';
export * from './lib/entities/IFilterOptions';
export * from './lib/entities/IFilterValues';
export * from './lib/entities/IMarkdownCellOptions';
export * from './lib/entities/IState';
export * from './lib/entities/ITableOptions';
export * from './lib/entities/ITileOptions';
export * from './lib/entities/IWidget';


// Chart Builders
export * from './lib/echart-chart-builders';
export {
  StockListChartBuilder,
  StockListData,
  StockListTableComponent,
  SelectedStockData,
  STOCK_LIST_AG_GRID_ENV,
  StockListAgGridEnvironment
} from './lib/echart-chart-builders/stock-list';


// Widgets
export * from './lib/widgets/echarts/echart.component';
export * from './lib/widgets/price-performance-strip/price-performance-strip.component';
export * from './lib/widgets/filter/filter.component';
export * from './lib/widgets/table/table.component';
export * from './lib/widgets/tile';
export * from './lib/widgets/stock-tile';
export * from './lib/widgets/markdown-cell/markdown-cell.component';