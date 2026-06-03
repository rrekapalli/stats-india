import type { ChartRenderMode } from './render-mode';

export type ChartTypeId =
  | 'bar'
  | 'horizontal-bar'
  | 'stacked-horizontal-bar'
  | 'stacked-vertical-bar'
  | 'negative-bar'
  | 'waterfall'
  | 'line'
  | 'area'
  | 'stacked-area'
  | 'scatter'
  | 'pie'
  | 'gauge'
  | 'heatmap'
  | 'density-map'
  | 'polar'
  | 'treemap'
  | 'sunburst'
  | 'zoomable-sunburst'
  | 'zoomable-icicle'
  | 'sankey'
  | 'candlestick'
  | 'stock-list'
  | 'histogram';

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartPoint {
  name?: string;
  value: number;
  [key: string]: unknown;
}

export interface ChartSeries {
  name?: string;
  type?: string;
  data: unknown[];
  stack?: string;
  color?: string;
  highlighted?: boolean;
  dimmed?: boolean;
}

export interface TreemapCellLabelLine {
  text: string;
  fontSize?: number;
  fontWeight?: number | string;
  fill?: string;
  /** When true, uses theme muted text color (ignored when fill is set). */
  muted?: boolean;
}

export interface HistogramSegmentFilter {
  id: string;
  label: string;
  /** Range lower bound in histogram display units (e.g. crore). */
  filterFrom: number;
  /** Range upper bound in histogram display units; use Infinity for open-ended. */
  filterTo: number;
  color: string;
  /** Optional short hint shown in filter chips / tooltips. */
  hint?: string;
}

export interface HierarchyNode {
  name: string;
  value?: number;
  children?: HierarchyNode[];
  /** Optional filter column for cross-chart filtering (e.g. sector, basicIndustry). */
  filterColumn?: string;
  /** Optional fill color for hierarchy segments (shared with linked charts). */
  color?: string;
  /** Theme-aware gain/loss/neutral tile fill; resolved at render time (pairs with treemapTileOpacity). */
  colorSemantic?: 'positive' | 'negative' | 'neutral';
  /** Optional multi-line treemap cell labels (overrides default name / count layout). */
  treemapLabels?: TreemapCellLabelLine[];
  /** When true, tile is laid out after same-level peers (e.g. aggregated "Others" bucket). */
  treemapSortLast?: boolean;
  /** Aggregated treemap bucket — click expands omitted stocks instead of cross-filtering. */
  treemapOthersBucket?: boolean;
  /** Symbols grouped under an "Others" bucket (for drill-down). */
  treemapOthersSymbols?: string[];
  /** Secondary line in chart tooltips (e.g. company name under trading symbol). */
  tooltipSubtitle?: string;
}

export interface ChartSankeyLink {
  source: string | number;
  target: string | number;
  value: number;
}

export interface ChartSankeyNode {
  name: string;
}

export interface OhlcPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface GaugeSpec {
  value: number;
  min?: number;
  max?: number;
  name?: string;
}

export interface HeatmapCell {
  x?: string | number;
  y?: string | number;
  value: number;
  dayIso?: string;
  bankDay?: string;
  [key: string]: unknown;
}

export interface GeoFeature {
  type: string;
  properties?: Record<string, unknown>;
  geometry?: unknown;
}

export interface D3ChartSpec {
  chartType: ChartTypeId;
  title?: string;
  subTitle?: string;
  categories?: string[];
  series?: ChartSeries[];
  colors?: string[];
  margin?: ChartMargin;
  horizontal?: boolean;
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueFormatter?: (v: number) => string;
  tooltipFormatter?: (datum: unknown) => string;
  /** Rich HTML tooltip body (built with buildChartTooltipHtml or custom markup). */
  tooltipHtmlFormatter?: (datum: unknown) => string;
  hierarchy?: HierarchyNode;
  sankeyNodes?: ChartSankeyNode[];
  sankeyLinks?: ChartSankeyLink[];
  gauge?: GaugeSpec;
  heatmapCells?: HeatmapCell[];
  /** GitHub-style calendar grid (one cell per day); uses SVG with margins and labels. */
  heatmapCalendar?: boolean;
  geoFeatures?: GeoFeature[];
  ohlc?: OhlcPoint[];
  polarCategories?: string[];
  highlightKeys?: Set<string>;
  dimOpacity?: number;
  /** 0–1 inner radius for donut pies */
  pieInnerRadius?: number;
  pieLabelsOutside?: boolean;
  pieMinLabelAngle?: number;
  /** Max slice labels drawn outside the donut (remaining slices: tooltip only). */
  pieMaxOutsideLabels?: number;
  /** Append share % to outside pie labels (default true when labels are outside). */
  pieLabelShowPercent?: boolean;
  /** Multiplier on max fit radius (1 = as large as plot allows; default ~0.65 with outside labels). */
  pieRadiusFactor?: number;
  /** Animate data updates (filter changes); resize still re-renders without motion when dimensions shift. */
  animateUpdates?: boolean;
  /** Transition duration in ms when animateUpdates is enabled. */
  transitionDurationMs?: number;
  xCategoryLabelRotate?: number;
  xCategoryLabelMaxLen?: number;
  /** Cartesian category axis tick font size in px (default 10). */
  xCategoryLabelFontSize?: number;
  /** Cartesian value axis tick font size in px (default 10). */
  yAxisTickFontSize?: number;
  /** Treemap: show name labels inside cells (default true). */
  treemapShowLabels?: boolean;
  /** Treemap cell label font size in px (default 8). */
  treemapLabelFontSize?: number;
  /** Treemap: second line under name with count and % of total (e.g. "42 - 3.2%"). */
  treemapShowCountPercent?: boolean;
  /** Treemap: scale cell label font sizes from value (e.g. market cap) between min/max px. */
  treemapAdaptiveLabels?: boolean;
  /** Treemap adaptive labels: minimum font size in px (default 4.8 ≈ 0.3rem). */
  treemapLabelFontMinPx?: number;
  /** Treemap adaptive labels: maximum font size in px (default 16 ≈ 1rem). */
  treemapLabelFontMaxPx?: number;
  /** Treemap rect fill-opacity (labels stay opaque); default 1. */
  treemapTileOpacity?: number;
  /** Treemap tiles with colorSemantic positive/negative — matches Signal entry/exit bar opacity. */
  treemapGainLossTileOpacity?: number;
  /** Resolve bar/treemap category fills from theme palette by name (visual-insights sector/industry). */
  themeCategoryColors?: boolean;
  /** Plot inset on each side as a fraction of chart width/height (default 3%). Applies to all chart types. */
  plotMarginPercent?: number;
  /** Top plot inset (overrides plotMarginPercent for top). */
  plotMarginPercentTop?: number;
  /** Left plot inset (overrides plotMarginPercent for left). */
  plotMarginPercentLeft?: number;
  /** Right plot inset (overrides plotMarginPercent for right). */
  plotMarginPercentRight?: number;
  /** Bottom plot inset (overrides plotMarginPercent for bottom). */
  plotMarginPercentBottom?: number;
  /** Raw numeric samples for histogram charts (D3 bin). */
  histogramValues?: number[];
  /** Number of histogram bins (default 20). */
  histogramBinCount?: number;
  /** Multiply bin edges when emitting range filters (values in spec may be display units). */
  histogramFilterScale?: number;
  /** Fundamental metric key for cross-filter (e.g. marketCap, pe). */
  histogramMetricField?: string;
  /** Use log-spaced bin thresholds when value range spans orders of magnitude. */
  histogramLogBins?: boolean;
  /** Vertical histogram: bar width ∝ sum of samples in each bin (metric contribution). */
  histogramBarWidthBySum?: boolean;
  /** Optional clickable cap-segment bar below histogram x-axis ticks (e.g. Small / Mid / Large). */
  histogramSegmentFilters?: HistogramSegmentFilter[];
  /** Scatter: expand x/y domain by this fraction of each axis span (e.g. 0.05 = 5%). */
  scatterDomainPaddingPercent?: number;
  /** Scatter: fixed [min, max] for the y-axis (overrides data extent and padding). */
  scatterYDomain?: [number, number];
  /** Scatter: fixed [min, max] for the x-axis (overrides data extent and padding). */
  scatterXDomain?: [number, number];
  /** Scatter: custom x-axis tick labels (e.g. dates from epoch ms). */
  scatterXTickFormat?: (value: number) => string;
  /** Scatter: custom y-axis tick labels (e.g. clock times from minutes). */
  scatterYTickFormat?: (value: number) => string;
  /** Scatter: emphasize x=0 and y=0 with darker reference lines when in domain (default true). */
  scatterShowZeroLines?: boolean;
  /** Scatter: draw a full plot border (top, right, bottom, left) around the grid (default true). */
  scatterShowPlotFrame?: boolean;
  /** Cartesian bars: show numeric value at the end of each bar. */
  barShowValueLabels?: boolean;
  /** Bar value label font size in px (default 10). */
  barValueLabelFontSize?: number;
  /** Sunburst / zoomable-sunburst: center hole as a fraction of plot radius (default 0.1). */
  sunburstInnerRadiusRatio?: number;
}

export interface D3ChartHandle {
  destroy(): void;
  resize(): void;
  update(spec: D3ChartSpec): void;
  getSVGElement(): SVGSVGElement | null;
  getCanvasElement(): HTMLCanvasElement | null;
  /** Legacy builder compatibility — returns current spec shape */
  getOption?(): unknown;
  /** Legacy builder compatibility — merges into spec and re-renders */
  setOption?(options: unknown, _notMerge?: boolean): void;
}

export interface ChartInteractionEvent {
  chartType: ChartTypeId;
  seriesName?: string;
  dataIndex?: number;
  datum: unknown;
  source: 'click' | 'dblclick';
}

export const DEFAULT_CHART_MARGIN: ChartMargin = {
  top: 48,
  right: 24,
  bottom: 48,
  left: 56,
};

export function resolveRenderMode(
  chartType: ChartTypeId,
  override?: ChartRenderMode
): ChartRenderMode {
  if (override) {
    return override;
  }
  const canvasTypes: ChartTypeId[] = ['scatter', 'heatmap', 'density-map', 'candlestick', 'stock-list'];
  return canvasTypes.includes(chartType) ? 'canvas' : 'svg';
}
