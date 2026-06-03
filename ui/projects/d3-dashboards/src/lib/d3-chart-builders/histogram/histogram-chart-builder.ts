import type { D3ChartSpec, HistogramSegmentFilter } from '../../chart-spec';
import { buildChartTooltipHtml } from '../../d3-core/chart-html-tooltip';

export interface HistogramBuildOptions {
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  binCount?: number;
  valueFormatter?: (v: number) => string;
  logBins?: boolean;
}

export interface FundamentalsHistogramOptions {
  binCount?: number;
  logBins?: boolean;
  horizontal?: boolean;
}

/** INR rupees → crore (÷ 1,00,00,000). */
export const INR_TO_CRORE = 1e7;

const DEFAULT_BIN_COUNT = 10;
export const MARKET_CAP_HISTOGRAM_BIN_COUNT = 10;

/** Market cap (Cr) segmentation for visual-insights histogram filter bar. */
export const MARKET_CAP_SEGMENT_FILTERS: HistogramSegmentFilter[] = [
  {
    id: 'small',
    label: 'Small',
    hint: '< 10,000 Cr',
    filterFrom: 0,
    filterTo: 10_000,
    color: '#4269d0'
  },
  {
    id: 'mid',
    label: 'Mid',
    hint: '10,000 – 50,000 Cr',
    filterFrom: 10_000,
    filterTo: 50_000,
    color: '#a463f2'
  },
  {
    id: 'large',
    label: 'Large',
    hint: '≥ 50,000 Cr',
    filterFrom: 50_000,
    filterTo: Number.POSITIVE_INFINITY,
    color: '#9c6b4e'
  }
];

/** Stored in INR; histogram axis shows crores. */
const CRORE_DISPLAY_FIELDS = new Set([
  'marketCap',
  'enterpriseValue',
  'totalRevenue',
  'totalDebt',
  'totalCash',
  'freeCashflow',
  'operatingCashflow',
  'grossProfit',
  'ebitda'
]);

export function fieldUsesCroreDisplay(field: string): boolean {
  return CRORE_DISPLAY_FIELDS.has(field);
}

/** Format a value already in crores as `x,xxx.y`. */
export function formatMarketCapCr(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
  }
  if (abs >= 100) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
  }
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}

export function formatFundamentalAxisValue(field: string, value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  if (fieldUsesCroreDisplay(field)) {
    return formatMarketCapCr(value);
  }
  const abs = Math.abs(value);
  if (abs >= 1e6) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
  }
  if (abs >= 1000) {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(value));
  }
  if (abs >= 100) {
    return value.toFixed(1);
  }
  if (abs >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

/** Rough SVG text width for axis tick layout (proportional sans-serif). */
export function estimateChartTextWidth(text: string, fontSize: number): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length * fontSize * 0.58);
}

export interface HistogramHorizontalMarginLayout {
  left: number;
  /** Horizontal anchor for rotated y-axis title (SVG `y` after rotate -90). */
  titleY: number;
}

/** Left margin for horizontal histograms from bin tick labels + optional y-axis title. */
export function computeHistogramHorizontalLeftMargin(
  binLabels: string[],
  yAxisLabel: string | undefined,
  tickFontSize = 8,
  titleFontSize = 11,
  chartWidth?: number
): HistogramHorizontalMarginLayout {
  const maxTick = binLabels.reduce(
    (mx, label) => Math.max(mx, estimateChartTextWidth(label, tickFontSize)),
    0
  );
  const outerPad = 4;
  const titleFootprint = yAxisLabel ? titleFontSize + 2 : 0;
  const titleGap = yAxisLabel ? 4 : 0;
  const axisPad = 6;
  let left = outerPad + titleFootprint + titleGap + maxTick + axisPad;
  const minLeft = 40;
  const maxLeft =
    chartWidth != null && chartWidth > 0
      ? Math.max(minLeft, Math.min(128, Math.round(chartWidth * 0.42)))
      : 128;
  left = Math.min(Math.max(minLeft, left), maxLeft);
  return {
    left,
    titleY: outerPad + Math.ceil(titleFootprint / 2)
  };
}

export function inrToCrore(value: number): number {
  return value / INR_TO_CRORE;
}

/** Pick a human-friendly step (1/2/5 × 10ⁿ) for ~binCount bands across [lo, hi]. */
export function histogramNiceStep(lo: number, hi: number, binCount: number): number {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || binCount < 1) {
    return 1;
  }
  const span = Math.max(hi - lo, 1e-9);
  const rawStep = span / binCount;
  if (rawStep <= 0) {
    return 1;
  }
  const exp = Math.floor(Math.log10(rawStep));
  const magnitude = 10 ** exp;
  const norm = rawStep / magnitude;
  let nice = 10;
  if (norm <= 1) {
    nice = 1;
  } else if (norm <= 2) {
    nice = 2;
  } else if (norm <= 5) {
    nice = 5;
  }
  return nice * magnitude;
}

/** Exactly `binCount` bins with rounded inner edges (linear step). */
export function buildHistogramNiceThresholds(
  values: number[],
  binCount: number
): { domain: [number, number]; thresholds: number[]; edges: number[] } {
  let lo = Math.min(...values.filter((v) => Number.isFinite(v)));
  let hi = Math.max(...values.filter((v) => Number.isFinite(v)));
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { domain: [0, 1], thresholds: [], edges: [0, 1] };
  }
  if (hi <= lo) {
    const pad = Math.abs(lo) * 0.001 || 1;
    lo -= pad;
    hi += pad;
  }
  const step = histogramNiceStep(lo, hi, binCount);
  const niceLo = Math.max(0, Math.floor(lo / step) * step);
  const niceHi = Math.max(Math.ceil(hi / step) * step, niceLo + step * binCount);
  const thresholds: number[] = [];
  for (let i = 1; i < binCount; i++) {
    thresholds.push(niceLo + step * i);
  }
  const edges = [niceLo, ...thresholds, niceHi];
  return { domain: [niceLo, niceHi], thresholds, edges };
}

const NICE_LOG_STOPS = [1, 2, 5];

function buildNiceValueLadder(maxVal: number): number[] {
  const ladder = [0];
  const maxExp = Math.ceil(Math.log10(Math.max(maxVal, 10)));
  for (let exp = -1; exp <= maxExp + 1; exp++) {
    for (const m of NICE_LOG_STOPS) {
      const v = m * 10 ** exp;
      if (v > 0 && v <= maxVal * 5) {
        ladder.push(v);
      }
    }
  }
  return [...new Set(ladder)].sort((a, b) => a - b);
}

function ladderCeil(ladder: number[], value: number): number {
  for (const v of ladder) {
    if (v >= value) {
      return v;
    }
  }
  return ladder[ladder.length - 1] ?? value;
}

type HistogramInterval = { lo: number; hi: number };

function mergeLeftmostInterval(intervals: HistogramInterval[]): HistogramInterval[] {
  if (intervals.length < 2) {
    return intervals;
  }
  return [{ lo: intervals[0].lo, hi: intervals[1].hi }, ...intervals.slice(2)];
}

function splitWidestInterval(intervals: HistogramInterval[]): HistogramInterval[] {
  let wi = 0;
  let wSpan = intervals[0].hi - intervals[0].lo;
  for (let i = 1; i < intervals.length; i++) {
    const span = intervals[i].hi - intervals[i].lo;
    if (span > wSpan) {
      wSpan = span;
      wi = i;
    }
  }
  const { lo, hi } = intervals[wi];
  const step = histogramNiceStep(lo, hi, 2);
  let mid = Math.round((lo + hi) / 2 / step) * step;
  if (mid <= lo || mid >= hi) {
    mid = lo + (hi - lo) / 2;
  }
  return [
    ...intervals.slice(0, wi),
    { lo, hi: mid },
    { lo: mid, hi },
    ...intervals.slice(wi + 1)
  ];
}

function intervalsFromLadder(ladder: number[], endHi: number): HistogramInterval[] {
  const endIdx = ladder.findIndex((v) => v >= endHi);
  const last = endIdx >= 0 ? endIdx : ladder.length - 1;
  const out: HistogramInterval[] = [];
  for (let i = 0; i < last; i++) {
    out.push({ lo: ladder[i], hi: ladder[i + 1] });
  }
  return out;
}

function intervalsForRange(ladder: number[], rangeLo: number, rangeHi: number): HistogramInterval[] {
  const loIdx = Math.max(0, ladder.findIndex((v) => v >= rangeLo) - 1);
  const hiIdx = ladder.findIndex((v) => v >= rangeHi);
  const last = hiIdx >= 0 ? hiIdx : ladder.length - 1;
  const out: HistogramInterval[] = [];
  for (let i = loIdx; i < last; i++) {
    out.push({ lo: ladder[i], hi: ladder[i + 1] });
  }
  return out;
}

function normalizeIntervalCount(intervals: HistogramInterval[], binCount: number): HistogramInterval[] {
  let next = [...intervals];
  while (next.length > binCount) {
    next = mergeLeftmostInterval(next);
  }
  while (next.length < binCount) {
    next = splitWidestInterval(next);
  }
  return next;
}

/** Log-style 1/2/5 × 10ⁿ bands merged to exactly `binCount` (e.g. 0–500, 500–1,000 Cr). */
export function buildHistogramLogNiceThresholds(
  values: number[],
  binCount: number
): { domain: [number, number]; thresholds: number[]; edges: number[] } {
  const finite = values.filter((v) => Number.isFinite(v) && v > 0);
  if (!finite.length) {
    return { domain: [0, 1], thresholds: [], edges: [0, 1] };
  }
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const spanRatio = hi / Math.max(lo, 1e-9);
  const ladder = buildNiceValueLadder(hi);
  const scoped = spanRatio < 50 && lo > hi * 0.08;
  let intervals: HistogramInterval[];
  if (scoped) {
    const floorLo = [...ladder].reverse().find((v) => v <= lo) ?? 0;
    intervals = intervalsForRange(ladder, floorLo, ladderCeil(ladder, hi));
    if (!intervals.length) {
      return buildHistogramNiceThresholds(finite, binCount);
    }
  } else {
    intervals = intervalsFromLadder(ladder, ladderCeil(ladder, hi));
  }
  intervals = normalizeIntervalCount(intervals, binCount);

  const edges = [intervals[0].lo, ...intervals.map((iv) => iv.hi)];
  const thresholds = edges.slice(1, -1);
  return { domain: [edges[0], edges[edges.length - 1]], thresholds, edges };
}

export function buildHistogramChartSpec(
  values: number[],
  options: HistogramBuildOptions = {}
): D3ChartSpec {
  const finite = values.filter((v) => Number.isFinite(v) && v > 0);
  const fmt = options.valueFormatter ?? formatMarketCapCr;
  return {
    chartType: 'histogram',
    title: options.title,
    histogramValues: finite,
    histogramBinCount: options.binCount ?? DEFAULT_BIN_COUNT,
    histogramLogBins: options.logBins ?? true,
    xAxisLabel: options.xAxisLabel ?? 'Value',
    yAxisLabel: options.yAxisLabel ?? 'Count',
    valueFormatter: fmt,
    animateUpdates: false,
    showGrid: true,
    plotMarginPercentBottom: 0.14,
    tooltipHtmlFormatter: (datum) => {
      const d = datum as { x0?: number; x1?: number; length?: number };
      const lo = d.x0 ?? 0;
      const hi = d.x1 ?? 0;
      const count = d.length ?? 0;
      return buildChartTooltipHtml('Range', [], [
        {
          title: 'Bin',
          rows: [
            { label: 'From', value: fmt(lo) },
            { label: 'To', value: fmt(hi) },
            { label: 'Stocks', value: String(count), highlight: true }
          ]
        }
      ]);
    }
  };
}

export function buildFundamentalsHistogramSpec(
  field: string,
  displayName: string,
  valuesRaw: number[],
  options: FundamentalsHistogramOptions = {}
): D3ChartSpec {
  const useCrore = fieldUsesCroreDisplay(field);
  const scale = useCrore ? INR_TO_CRORE : 1;
  const unitSuffix = useCrore ? ' Cr' : '';
  const plotValues = valuesRaw
    .filter((v) => Number.isFinite(v) && v > 0)
    .map((v) => v / scale);
  const fmt = (v: number) => formatFundamentalAxisValue(field, v);
  const metricLabel = useCrore ? `${displayName} (Cr)` : displayName;
  const horizontal = options.horizontal ?? false;
  const universeStockCount = plotValues.length;
  const universeMetricSum = plotValues.reduce((acc, v) => acc + v, 0);
  const pct = (part: number, whole: number): string =>
    whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '—';

  return {
    ...buildHistogramChartSpec(plotValues, {
      binCount: options.binCount ?? MARKET_CAP_HISTOGRAM_BIN_COUNT,
      logBins: options.logBins ?? true,
      xAxisLabel: horizontal ? 'Stocks' : metricLabel,
      yAxisLabel: horizontal ? metricLabel : 'Stocks',
      valueFormatter: fmt
    }),
    histogramFilterScale: scale,
    histogramMetricField: field,
    horizontal,
    histogramBarWidthBySum: !horizontal,
    barShowValueLabels: true,
    barValueLabelFontSize: 8,
    ...(field === 'marketCap' && !horizontal
      ? {
          histogramSegmentFilters: MARKET_CAP_SEGMENT_FILTERS,
          margin: { top: 12, right: 12, bottom: 72, left: 44 }
        }
      : {
          margin: horizontal
            ? { top: 12, right: 28, bottom: 36, left: 40 }
            : { top: 12, right: 12, bottom: 72, left: 44 }
        }),
    tooltipHtmlFormatter: (datum) => {
      const d = datum as { x0?: number; x1?: number; length?: number; metricSum?: number };
      const lo = (d.x0 ?? 0) / scale;
      const hi = (d.x1 ?? 0) / scale;
      const count = d.length ?? 0;
      const total = (d.metricSum ?? 0) / scale;
      return buildChartTooltipHtml(displayName, [], [
        {
          title: 'Range',
          rows: [
            { label: 'From', value: `${fmt(lo)}${unitSuffix}` },
            { label: 'To', value: `${fmt(hi)}${unitSuffix}` },
            {
              label: 'Stocks',
              value: `${count} (${pct(count, universeStockCount)})`,
              highlight: true
            },
            {
              label: 'Total',
              value: `${fmt(total)}${unitSuffix} (${pct(total, universeMetricSum)})`
            }
          ]
        }
      ]);
    }
  };
}

/** @deprecated use buildFundamentalsHistogramSpec */
export function buildMarketCapHistogramSpec(
  valuesInr: number[],
  options: FundamentalsHistogramOptions = {}
): D3ChartSpec {
  return buildFundamentalsHistogramSpec('marketCap', 'Market Cap', valuesInr, options);
}
