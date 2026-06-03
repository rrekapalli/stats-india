import { select, type Selection } from 'd3-selection';
import { axisBottom, axisLeft, axisRight } from 'd3-axis';
import { arc, line, pie, stack, area as d3Area } from 'd3-shape';
import { hierarchy, treemap, treemapSquarify, partition, type HierarchyRectangularNode } from 'd3-hierarchy';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';
import { max, min, extent, sum, bin as d3Bin, type Bin } from 'd3-array';
import { format as d3Format } from 'd3-format';
import type {
  ChartInteractionEvent,
  ChartMargin,
  ChartPoint,
  ChartSeries,
  D3ChartHandle,
  D3ChartSpec,
  HierarchyNode,
  HistogramSegmentFilter,
} from '../chart-spec';
import { plotInnerSize, resolveChartMargin, hierarchyLeafValue } from '../chart-spec';
import { getMoneytreeChartUiColors, getCategoryChartColor, getHistogramBarPalette, getMarketCapSegmentColors, getTreemapSemanticTileBaseColors } from './theme';
import { emitInteraction, type InteractionHandler } from './interaction';
import {
  hideChartTooltip,
  moveChartTooltip,
  resolveTooltipHtml,
  showChartTooltip,
} from './chart-html-tooltip';
import {
  CHART_ENTER_MS,
  chartTransition,
  clearContainer,
  ensureChartSvg,
  measureChartContainer,
  transitionSelection,
} from './chart-transitions';
import {
  buildHistogramLogNiceThresholds,
  buildHistogramNiceThresholds,
  computeHistogramHorizontalLeftMargin,
} from '../d3-chart-builders/histogram/histogram-chart-builder';
import { renderZoomableSunburstSvg } from './zoomable-sunburst-renderer';
import { renderZoomableIcicleSvg } from './zoomable-icicle-renderer';

import { OBSERVABLE_10 } from './theme';

const DEFAULT_SERIES_COLORS = [...OBSERVABLE_10];

export interface RenderContext {
  container: HTMLElement;
  spec: D3ChartSpec;
  width: number;
  height: number;
  onClick?: InteractionHandler;
  onDblClick?: InteractionHandler;
  /** Data-only update — morph marks instead of replacing the whole SVG. */
  animate?: boolean;
}

function shouldAnimate(ctx: RenderContext): boolean {
  return Boolean(ctx.animate && ctx.spec.animateUpdates !== false);
}

function transitionMs(spec: D3ChartSpec): number {
  return spec.transitionDurationMs ?? CHART_ENTER_MS;
}

function innerSize(spec: D3ChartSpec, width: number, height: number) {
  return plotInnerSize(spec, width, height);
}

const DEFAULT_SCATTER_DOMAIN_PADDING_PERCENT = 0.05;

function scatterMargin(spec: D3ChartSpec, width: number, height: number): ChartMargin {
  const base = resolveChartMargin(spec, width, height, {
    min: { left: 48, right: 16, top: 16, bottom: 44 },
  });
  const bottomFloor = spec.xAxisLabel ? 68 : 52;
  return {
    ...base,
    bottom: Math.max(base.bottom, bottomFloor),
    left: Math.max(base.left, 48),
  };
}

function scatterInnerSize(spec: D3ChartSpec, width: number, height: number) {
  const m = scatterMargin(spec, width, height);
  return { w: Math.max(10, width - m.left - m.right), h: Math.max(10, height - m.top - m.bottom), m };
}

function truncateCategoryLabel(label: string, maxLen: number): string {
  const s = String(label);
  return s.length > maxLen ? `${s.slice(0, Math.max(1, maxLen - 1))}…` : s;
}

function truncateLabelToWidth(label: string, pxWidth: number, fontSize: number): string {
  const maxChars = Math.max(1, Math.floor((pxWidth - 6) / (fontSize * 0.55)));
  return truncateCategoryLabel(label, maxChars);
}

const HIST_CAP_SEGMENT_BAR_HEIGHT = 36;
const HIST_CAP_SEGMENT_GAP = 4;

function valueInCapSegment(v: number, seg: HistogramSegmentFilter): boolean {
  const lo = seg.filterFrom;
  const hi = seg.filterTo;
  if (!Number.isFinite(hi) || hi === Number.POSITIVE_INFINITY) {
    return v >= lo;
  }
  return v >= lo && v < hi;
}

interface CapSegmentLayout {
  index: number;
  seg: HistogramSegmentFilter;
  count: number;
  metricSum: number;
  x: number;
  width: number;
}

function layoutCapSegmentFilterSegments(
  values: number[],
  segments: HistogramSegmentFilter[],
  plotWidth: number
): CapSegmentLayout[] {
  const stats = segments.map((seg, index) => {
    const inSeg = values.filter((v) => valueInCapSegment(v, seg));
    return {
      index,
      seg,
      count: inSeg.length,
      metricSum: sum(inSeg, (v) => v) ?? 0
    };
  });
  const totalMetricSum = sum(stats, (s) => s.metricSum) ?? 0;
  const segCount = segments.length || 1;
  const rawWidths = stats.map((s) => {
    if (totalMetricSum > 0 && s.metricSum > 0) {
      return (s.metricSum / totalMetricSum) * plotWidth;
    }
    return s.count > 0 ? Math.max(2, plotWidth / segCount / 12) : 1;
  });
  const widthTotal = sum(rawWidths, (v) => v) ?? plotWidth;
  const norm = plotWidth / (widthTotal || plotWidth);
  let xCursor = 0;
  return stats.map((s, i) => {
    const width = Math.max(1, rawWidths[i] * norm);
    const layout = { ...s, x: xCursor, width };
    xCursor += width;
    return layout;
  });
}

function resolveBarPointFill(
  spec: D3ChartSpec,
  point: ChartPoint,
  pointIndex: number,
  seriesColor: string
): string {
  const style = (point as ChartPoint & { itemStyle?: { color?: string } }).itemStyle;
  if (style?.color) {
    return style.color;
  }
  if (spec.themeCategoryColors) {
    const name = String(point.name ?? spec.categories?.[pointIndex] ?? pointIndex);
    return getCategoryChartColor(name);
  }
  return seriesColor;
}

function resolveHistogramBarFill(spec: D3ChartSpec, index: number, binLo?: number, binHi?: number): string {
  const palette =
    spec.colors && spec.colors.length > 0 ? spec.colors : getHistogramBarPalette();
  const lo = binLo ?? 0;
  const hi = binHi ?? lo;
  const mid = (lo + hi) / 2;
  const segments = spec.histogramSegmentFilters;
  if (segments?.length && Number.isFinite(mid)) {
    const capColors = getMarketCapSegmentColors();
    for (const seg of segments) {
      const cap = Number.isFinite(seg.filterTo) && seg.filterTo !== Number.POSITIVE_INFINITY ? seg.filterTo : Infinity;
      if (mid >= seg.filterFrom && mid < cap) {
        return capColors[seg.id] ?? seg.color ?? palette[index % palette.length]!;
      }
    }
    const last = segments[segments.length - 1]!;
    if (mid >= last.filterFrom) {
      return capColors[last.id] ?? last.color ?? palette[index % palette.length]!;
    }
  }
  return palette[index % palette.length]!;
}

function resolveTreemapCellFillOpacity(node: HierarchyNode, spec: D3ChartSpec): number {
  if (node.colorSemantic === 'positive' || node.colorSemantic === 'negative') {
    return spec.treemapGainLossTileOpacity ?? spec.treemapTileOpacity ?? 1;
  }
  return spec.treemapTileOpacity ?? 1;
}

function resolveTreemapCellFill(node: HierarchyNode, spec: D3ChartSpec, index: number): string {
  if (node.colorSemantic) {
    return getTreemapSemanticTileBaseColors()[node.colorSemantic];
  }
  if (node.color) {
    return node.color;
  }
  if (spec.themeCategoryColors && node.filterColumn && node.name) {
    return getCategoryChartColor(String(node.name));
  }
  return spec.colors?.[index % (spec.colors?.length ?? 8)] ?? '#4a90d9';
}

function capSegmentBoundaryXs(layout: CapSegmentLayout[]): number[] {
  return layout.slice(0, -1).map((item) => item.x + item.width);
}

function renderHistogramCapBoundaryGuides(
  plotG: Selection<SVGGElement, unknown, null, undefined>,
  boundaryXs: number[],
  plotHeight: number,
  ui: ReturnType<typeof getMoneytreeChartUiColors>
): void {
  plotG.selectAll('line.hist-cap-boundary').remove();
  if (!boundaryXs.length) {
    return;
  }
  plotG
    .selectAll<SVGLineElement, number>('line.hist-cap-boundary')
    .data(boundaryXs)
    .join('line')
    .attr('class', 'hist-cap-boundary')
    .attr('x1', (d) => d)
    .attr('x2', (d) => d)
    .attr('y1', 0)
    .attr('y2', plotHeight)
    .attr('stroke', ui.border)
    .attr('stroke-opacity', 0.65)
    .attr('stroke-width', 1)
    .attr('pointer-events', 'none');
}

function renderHistogramCapSegmentFilters(
  ctx: Pick<RenderContext, 'spec' | 'onClick' | 'onDblClick'>,
  plotG: Selection<SVGGElement, unknown, null, undefined>,
  layout: CapSegmentLayout[],
  ui: ReturnType<typeof getMoneytreeChartUiColors>
): number {
  const { spec, onClick, onDblClick } = ctx;
  const segments = spec.histogramSegmentFilters;
  if (!segments?.length || !layout.length) {
    return 0;
  }

  plotG.selectAll('g.hist-segment-filter-layer').remove();

  const filterScale = spec.histogramFilterScale ?? 1;
  const metricField = spec.histogramMetricField ?? 'marketCap';
  const fmt = spec.valueFormatter ?? ((v: number) => String(v));
  const crSuffix = metricField === 'marketCap' ? ' Cr' : '';
  const barH = HIST_CAP_SEGMENT_BAR_HEIGHT;
  const totalMc = sum(layout, (s) => s.metricSum) ?? 0;
  const totalCount = sum(layout, (s) => s.count) ?? 0;
  const layer = plotG.append('g').attr('class', 'hist-segment-filter-layer');

  layout.forEach((item) => {
    const { seg, index, x, width, count, metricSum } = item;
    const rawLo = seg.filterFrom * filterScale;
    const rawHi =
      !Number.isFinite(seg.filterTo) || seg.filterTo === Number.POSITIVE_INFINITY
        ? 1e18
        : seg.filterTo * filterScale;
    const loDisp = fmt(seg.filterFrom);
    const hiDisp =
      Number.isFinite(seg.filterTo) && seg.filterTo !== Number.POSITIVE_INFINITY
        ? fmt(seg.filterTo)
        : null;
    const displayLabel =
      seg.hint ??
      (hiDisp == null
        ? `${seg.label} (≥ ${loDisp}${crSuffix})`
        : `${seg.label} (${loDisp} – ${hiDisp}${crSuffix})`);
    const payload = {
      x0: rawLo,
      x1: rawHi,
      length: count,
      metricSum: metricSum * filterScale,
      filterColumn: metricField,
      displayLabel
    };

    const capColors = getMarketCapSegmentColors();
    const segFill = capColors[seg.id] ?? seg.color;
    const gSeg = layer.append('g').attr('class', 'hist-segment-filter');
    gSeg
      .append('rect')
      .attr('x', x)
      .attr('y', 0)
      .attr('width', Math.max(0, width - 1))
      .attr('height', barH)
      .attr('fill', segFill)
      .attr('opacity', 0.92)
      .style('cursor', 'pointer')
      .each(function () {
        attachInteractive(select(this), spec, payload, 'CapSegment', index, onClick, onDblClick);
      });

    const textColor = index === 0 ? ui.textPrimary : '#fff';
    const mcPct = totalMc > 0 ? ((metricSum / totalMc) * 100).toFixed(1) : '0.0';
    const countPct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
    const mcLine = `${fmt(metricSum)}${crSuffix} (${mcPct}%)`;
    const countLine = `${new Intl.NumberFormat('en-IN').format(count)} stocks (${countPct}%)`;
    const labelFs = width >= 56 ? 8 : 7;
    const statFs = width >= 56 ? 7 : 6;
    const cx = x + Math.max(0, width - 1) / 2;
    const text = gSeg
      .append('text')
      .attr('x', cx)
      .attr('y', 8)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', labelFs)
      .attr('font-weight', 700)
      .attr('pointer-events', 'none');

    text.append('tspan').attr('x', cx).attr('dy', 0).text(seg.label);
    if (width >= 36) {
      text
        .append('tspan')
        .attr('x', cx)
        .attr('dy', statFs + 2)
        .attr('font-size', statFs)
        .attr('font-weight', 500)
        .text(truncateLabelToWidth(mcLine, width - 4, statFs));
    }
    if (width >= 48) {
      text
        .append('tspan')
        .attr('x', cx)
        .attr('dy', statFs + 1)
        .attr('font-size', statFs)
        .attr('font-weight', 500)
        .text(truncateLabelToWidth(countLine, width - 4, statFs));
    }
  });

  return barH + HIST_CAP_SEGMENT_GAP;
}

function formatAxisNumber(v: number): string {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return '';
  }
  const abs = Math.abs(n);
  if (abs >= 1e9) {
    return d3Format('.2s')(n);
  }
  if (abs >= 1000) {
    return d3Format(',.0f')(n);
  }
  if (abs >= 1) {
    return d3Format(',.2f')(n);
  }
  return d3Format('.3f')(n);
}

function formatBarValueLabel(spec: D3ChartSpec, v: number): string {
  if (spec.valueFormatter) {
    return spec.valueFormatter(v);
  }
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return '';
  }
  if (Number.isInteger(n)) {
    return new Intl.NumberFormat('en-IN').format(n);
  }
  return formatAxisNumber(n);
}

function styleAxisDomain(axisG: Selection<any, any, any, any>, stroke: string): void {
  axisG.selectAll('.domain').attr('stroke', stroke).attr('stroke-width', 1);
  axisG.selectAll('.tick line').attr('stroke', stroke);
}

function paddedScatterDomain(
  minVal: number,
  maxVal: number,
  padRatio: number = DEFAULT_SCATTER_DOMAIN_PADDING_PERCENT
): [number, number] {
  const span = maxVal - minVal;
  const pad = span > 0 ? span * padRatio : Math.max(Math.abs(minVal), Math.abs(maxVal), 1) * padRatio;
  return [minVal - pad, maxVal + pad];
}

function asPoints(data: unknown[]): ChartPoint[] {
  return (data ?? []).map((d) => {
    if (typeof d === 'number') {
      return { value: d };
    }
    if (Array.isArray(d)) {
      return { value: Number(d[1]) || 0, name: String(d[0]) };
    }
    const o = d as ChartPoint & { x?: number; y?: number };
    const rawValue = o.value;
    const value = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === 'number' && Number.isFinite(rawValue)
        ? rawValue
        : Number(rawValue) || 0;
    return {
      ...o,
      name: o.name,
      value,
      ...(o.x != null ? { x: o.x } : {}),
      ...(o.y != null ? { y: o.y } : {}),
    };
  });
}

function formatValue(spec: D3ChartSpec, v: number): string {
  return spec.valueFormatter ? spec.valueFormatter(v) : String(v);
}

function attachInteractive(
  el: Selection<any, any, any, any>,
  spec: D3ChartSpec,
  datum: unknown,
  seriesName: string | undefined,
  dataIndex: number | undefined,
  onClick?: InteractionHandler,
  onDblClick?: InteractionHandler
): void {
  const tipHtml = resolveTooltipHtml(spec, datum);
  el.style('cursor', 'pointer').style('pointer-events', 'all');

  if (tipHtml) {
    el
      .on('mouseenter', (event: MouseEvent) => {
        showChartTooltip(tipHtml, event);
      })
      .on('mousemove', (event: MouseEvent) => {
        moveChartTooltip(event);
      })
      .on('mouseleave', () => {
        hideChartTooltip();
      });
  }

  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  el.on('click', (event: MouseEvent) => {
    event.stopPropagation();
    if (clickTimer) {
      clearTimeout(clickTimer);
    }
    clickTimer = setTimeout(() => {
      clickTimer = null;
      emitInteraction({ click: onClick, dblclick: onDblClick }, spec.chartType, datum, 'click', seriesName, dataIndex);
    }, 200);
  });
  el.on('dblclick', (event: MouseEvent) => {
    event.stopPropagation();
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
    }
    emitInteraction({ click: onClick, dblclick: onDblClick }, spec.chartType, datum, 'dblclick', seriesName, dataIndex);
  });
}

/** @deprecated use buildHistogramLogNiceThresholds / buildHistogramNiceThresholds */
function histogramThresholds(values: number[], binCount: number, useLog: boolean): number[] {
  return (useLog ? buildHistogramLogNiceThresholds(values, binCount) : buildHistogramNiceThresholds(values, binCount))
    .thresholds;
}

function binMetricSum(bin: Iterable<number>): number {
  return sum(bin, (v) => v) ?? 0;
}

function layoutHistogramWidthBySumSegments(
  bins: Bin<number, number>[],
  plotWidth: number
): { index: number; bin: Bin<number, number>; count: number; metricSum: number; x: number; width: number }[] {
  const binCount = bins.length || 1;
  const totalMetricSum = sum(bins, (b) => binMetricSum(b)) ?? 0;
  const rawWidths = bins.map((b) => {
    const metricSum = binMetricSum(b);
    if (totalMetricSum > 0 && metricSum > 0) {
      return (metricSum / totalMetricSum) * plotWidth;
    }
    return b.length > 0 ? Math.max(2, plotWidth / binCount / 12) : 1;
  });
  const widthTotal = sum(rawWidths, (v) => v) ?? plotWidth;
  const norm = plotWidth / (widthTotal || plotWidth);
  let xCursor = 0;
  return bins.map((bin, index) => {
    const metricSum = binMetricSum(bin);
    const width = Math.max(1, rawWidths[index] * norm);
    const seg = { index, bin, count: bin.length, metricSum, x: xCursor, width };
    xCursor += width;
    return seg;
  });
}

function normalizeHistogramSegmentWidths(
  segments: ReturnType<typeof layoutHistogramWidthBySumSegments>,
  plotWidth: number
): ReturnType<typeof layoutHistogramWidthBySumSegments> {
  const widthTotal = sum(segments, (s) => s.width) ?? plotWidth;
  if (widthTotal <= plotWidth || widthTotal <= 0) {
    return segments;
  }
  const shrink = plotWidth / widthTotal;
  let xCursor = 0;
  return segments.map((seg) => {
    const width = seg.width * shrink;
    const next = { ...seg, x: xCursor, width };
    xCursor += width;
    return next;
  });
}

function renderHistogramSvg(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const animate = shouldAnimate(ctx);
  const durationMs = transitionMs(spec);
  const t = chartTransition(animate, durationMs);
  const values = (spec.histogramValues ?? []).filter((v) => Number.isFinite(v) && v > 0);
  const fmt = spec.valueFormatter ?? ((v: number) => String(v));
  const filterScale = spec.histogramFilterScale ?? 1;
  const metricField = spec.histogramMetricField ?? 'marketCap';
  const crSuffix =
    metricField === 'marketCap' ||
    metricField === 'enterpriseValue' ||
    metricField === 'totalRevenue' ||
    metricField === 'totalDebt' ||
    metricField === 'totalCash' ||
    metricField === 'freeCashflow' ||
    metricField === 'operatingCashflow' ||
    metricField === 'grossProfit' ||
    metricField === 'ebitda'
      ? ' Cr'
      : '';

  const defaultHistMin = spec.horizontal
    ? { left: 40, right: 28, top: 12, bottom: 36 }
    : spec.histogramBarWidthBySum
      ? { left: 44, right: 12, top: 12, bottom: 72 }
      : { left: 52, right: 12, top: 16, bottom: 56 };

  let histMargin = resolveChartMargin(spec, width, height, { min: defaultHistMin });
  let horizontalTitleY = 10;
  let w = Math.max(0, width - histMargin.left - histMargin.right);
  let h = Math.max(0, height - histMargin.top - histMargin.bottom);
  let m = histMargin;

  const svg = ensureChartSvg(container, width, height, !animate);
  let g = svg.select<SVGGElement>('g.histogram-plot');
  if (animate) {
    g.selectAll('.axis, .grid, g.hist-segment-filter-layer, line.hist-cap-boundary').remove();
    svg.selectAll('.chart-title, text.chart-hist-x-axis-title').remove();
  } else {
    g.selectAll('*').remove();
    svg.selectAll('.chart-title, text.chart-hist-x-axis-title').remove();
  }

  if (!values.length) {
    if (g.empty()) {
      g = svg.append('g').attr('class', 'histogram-plot').attr('transform', `translate(${m.left},${m.top})`);
    } else if (t) {
      transitionSelection(g, t).attr('transform', `translate(${m.left},${m.top})`);
    } else {
      g.attr('transform', `translate(${m.left},${m.top})`);
    }
    g.append('text')
      .attr('x', w / 2)
      .attr('y', h / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .text('No data');
    return;
  }

  const binCount = spec.histogramBinCount ?? 10;
  const useLogNice = spec.histogramLogBins !== false;
  const { domain: binDomain, thresholds } = useLogNice
    ? buildHistogramLogNiceThresholds(values, binCount)
    : buildHistogramNiceThresholds(values, binCount);
  const bins = d3Bin().domain(binDomain).thresholds(thresholds)(values);

  const formatBinRangeLabel = (d: (typeof bins)[number]) => {
    const lo = d.x0 ?? 0;
    const hi = d.x1 ?? 0;
    return `${fmt(lo)}–${fmt(hi)}`;
  };

  if (spec.horizontal) {
    const horizontalLayout = computeHistogramHorizontalLeftMargin(
      bins.map(formatBinRangeLabel),
      spec.yAxisLabel,
      8,
      11,
      width
    );
    horizontalTitleY = horizontalLayout.titleY;
    histMargin = resolveChartMargin(spec, width, height, {
      min: { ...defaultHistMin, left: horizontalLayout.left },
    });
    m = histMargin;
    w = Math.max(0, width - m.left - m.right);
    h = Math.max(0, height - m.top - m.bottom);
  }

  if (g.empty()) {
    g = svg.append('g').attr('class', 'histogram-plot').attr('transform', `translate(${m.left},${m.top})`);
  } else if (t) {
    transitionSelection(g, t).attr('transform', `translate(${m.left},${m.top})`);
  } else {
    g.attr('transform', `translate(${m.left},${m.top})`);
  }

  const attachBinPayload = (
    el: Element,
    d: (typeof bins)[number],
    i: number,
    metricSumDisplay?: number
  ) => {
    const lo = d.x0 ?? 0;
    const hi = d.x1 ?? 0;
    const rawLo = lo * filterScale;
    const rawHi = hi * filterScale;
    const sumDisplay = metricSumDisplay ?? binMetricSum(d);
    const rawSum = sumDisplay * filterScale;
    const payload = {
      x0: rawLo,
      x1: rawHi,
      length: d.length,
      metricSum: rawSum,
      name: `${rawLo}-${rawHi}`,
      filterKey: `${rawLo}-${rawHi}`,
      filterColumn: metricField,
      displayLabel: `${fmt(lo)} – ${fmt(hi)}${crSuffix} (${d.length} stocks, ${fmt(sumDisplay)}${crSuffix} total)`
    };
    attachInteractive(select(el), spec, payload, 'Count', i, onClick, onDblClick);
  };

  if (spec.horizontal) {
    const binKeys = bins.map((_, i) => String(i));
    const countMax = max(bins, (b) => b.length) ?? 1;
    const countPad = spec.barShowValueLabels ? 1.15 : 1.05;
    const xCountScale = scaleLinear().domain([0, countMax * countPad]).nice().range([0, w]);
    const yBandScale = scaleBand<string>().domain(binKeys).range([h, 0]).padding(0.14);
    const bandH = yBandScale.bandwidth();

    if (spec.showGrid !== false) {
      g.append('g')
        .attr('class', 'grid')
        .call(axisBottom(xCountScale).tickSize(-h).tickFormat(() => ''))
        .call((sel) => sel.selectAll('.domain').remove())
        .call((sel) => sel.selectAll('line').attr('stroke', ui.border).attr('stroke-opacity', 0.35));
    }

    g.selectAll<SVGRectElement, (typeof bins)[number]>('rect.hist-bar')
      .data(bins)
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('class', 'hist-bar')
            .attr('opacity', 0.88)
            .attr('stroke-width', 0.5),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('fill', (d, i) => resolveHistogramBarFill(spec, i, d.x0, d.x1))
      .attr('stroke', (d, i) => resolveHistogramBarFill(spec, i, d.x0, d.x1))
      .attr('x', 0)
      .attr('width', (d) => (d.length > 0 ? xCountScale(d.length) : 0))
      .attr('y', (_, i) => yBandScale(String(i)) ?? 0)
      .attr('height', bandH)
      .each(function (d, i) {
        attachBinPayload(this, d, i);
      });

    if (spec.barShowValueLabels) {
      const labelFs = spec.barValueLabelFontSize ?? 8;
      g.selectAll<SVGTextElement, { bin: (typeof bins)[number]; index: number }>('text.hist-bar-label')
        .data(
          bins
            .map((bin, index) => ({ bin, index }))
            .filter(({ bin }) => bin.length > 0)
        )
        .join(
          (enter) =>
            enter
              .append('text')
              .attr('class', 'hist-bar-label')
              .attr('fill', ui.textMuted)
              .attr('font-size', labelFs)
              .attr('pointer-events', 'none')
              .attr('text-anchor', 'start'),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr('x', ({ bin }) => xCountScale(bin.length) + 4)
        .attr('y', ({ index }) => (yBandScale(String(index)) ?? 0) + bandH / 2)
        .attr('dy', '0.35em')
        .text(({ bin }) => new Intl.NumberFormat('en-IN').format(bin.length));
    }

    const xAxis = g.append('g').attr('class', 'axis axis-x').attr('transform', `translate(0,${h})`);
    xAxis.call(axisBottom(xCountScale).ticks(5).tickFormat(d3Format('~s')));
    xAxis.selectAll('text').attr('fill', ui.textMuted).attr('font-size', 10);
    xAxis.selectAll('line, path').attr('stroke', ui.border);

    const yAxis = g.append('g').attr('class', 'axis axis-y');
    yAxis
      .call(
        axisLeft(yBandScale).tickFormat((key) => {
          const b = bins[Number(key)];
          return b ? formatBinRangeLabel(b) : '';
        })
      )
      .selectAll('text')
      .attr('fill', ui.textMuted)
      .attr('font-size', 8);
    yAxis.selectAll('line, path').attr('stroke', ui.border);

    if (spec.xAxisLabel) {
      svg
        .append('text')
        .attr('x', m.left + w / 2)
        .attr('y', height - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', ui.textMuted)
        .attr('font-size', 11)
        .text(spec.xAxisLabel);
    }
    if (spec.yAxisLabel) {
      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(m.top + h / 2))
        .attr('y', horizontalTitleY)
        .attr('text-anchor', 'middle')
        .attr('fill', ui.textMuted)
        .attr('font-size', 11)
        .text(spec.yAxisLabel);
    }
    return;
  }

  if (spec.histogramBarWidthBySum) {
    const segments = normalizeHistogramSegmentWidths(layoutHistogramWidthBySumSegments(bins, w), w);
    const capLayout =
      spec.histogramSegmentFilters?.length && spec.histogramSegmentFilters
        ? layoutCapSegmentFilterSegments(values, spec.histogramSegmentFilters, w)
        : [];
    const capSegBand = capLayout.length
      ? renderHistogramCapSegmentFilters(ctx, g, capLayout, ui)
      : 0;
    if (capLayout.length) {
      renderHistogramCapBoundaryGuides(g, capSegmentBoundaryXs(capLayout), h, ui);
    }
    const yMax = max(segments, (s) => s.count) ?? 1;
    const yPad = spec.barShowValueLabels ? 1.12 : 1.05;
    const yScale = scaleLinear()
      .domain([0, yMax * yPad])
      .nice()
      .range([h, capSegBand]);

    if (spec.showGrid !== false) {
      g.append('g')
        .attr('class', 'grid')
        .call(axisLeft(yScale).tickSize(-w).tickFormat(() => ''))
        .call((sel) => sel.selectAll('.domain').remove())
        .call((sel) => sel.selectAll('line').attr('stroke', ui.border).attr('stroke-opacity', 0.35));
    }

    g.selectAll<SVGRectElement, (typeof segments)[number]>('rect.hist-bar')
      .data(segments)
      .join(
        (enter) =>
          enter
            .append('rect')
            .attr('class', 'hist-bar')
            .attr('opacity', 0.88)
            .attr('stroke-width', 0.5),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('fill', (d) => resolveHistogramBarFill(spec, d.index, d.bin.x0, d.bin.x1))
      .attr('stroke', (d) => resolveHistogramBarFill(spec, d.index, d.bin.x0, d.bin.x1))
      .attr('x', (d) => d.x)
      .attr('width', (d) => Math.max(0, d.width - 1))
      .attr('y', (d) => (d.count > 0 ? yScale(d.count) : h))
      .attr('height', (d) => (d.count > 0 ? h - yScale(d.count) : 0))
      .each(function (d) {
        attachBinPayload(this, d.bin, d.index, d.metricSum);
      });

    if (spec.barShowValueLabels) {
      const labelFs = spec.barValueLabelFontSize ?? 8;
      g.selectAll<SVGTextElement, (typeof segments)[number]>('text.hist-bar-label')
        .data(segments.filter((s) => s.count > 0))
        .join(
          (enter) =>
            enter
              .append('text')
              .attr('class', 'hist-bar-label')
              .attr('fill', ui.textMuted)
              .attr('font-size', labelFs)
              .attr('pointer-events', 'none')
              .attr('text-anchor', 'middle'),
          (update) => update,
          (exit) => exit.remove()
        )
        .attr('x', (d) => d.x + d.width / 2)
        .attr('y', (d) => yScale(d.count) - 4)
        .text((d) => new Intl.NumberFormat('en-IN').format(d.count));
    }

    const yAxis = g.append('g').attr('class', 'axis axis-y');
    yAxis.call(axisLeft(yScale).ticks(5).tickFormat(d3Format('~s')));
    yAxis.selectAll('text').attr('fill', ui.textMuted).attr('font-size', 10);
    yAxis.selectAll('line, path').attr('stroke', ui.border);

    const xAxis = g.append('g').attr('class', 'axis axis-x').attr('transform', `translate(0,${h})`);
    xAxis.selectAll('line, path').attr('stroke', ui.border);
    xAxis
      .selectAll<SVGTextElement, (typeof segments)[number]>('text.hist-x-label')
      .data(segments)
      .join(
        (enter) =>
          enter
            .append('text')
            .attr('class', 'hist-x-label')
            .attr('fill', ui.textMuted)
            .attr('font-size', 8)
            .attr('text-anchor', 'end'),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('x', (d) => d.x + d.width / 2)
      .attr('y', 0)
      .attr('transform', (d) => {
        const cx = d.x + d.width / 2;
        return `rotate(-35, ${cx}, 0)`;
      })
      .attr('dx', '-0.2em')
      .attr('dy', '0.8em')
      .text((d) => formatBinRangeLabel(d.bin));

    if (spec.xAxisLabel) {
      svg
        .append('text')
        .attr('class', 'chart-hist-x-axis-title')
        .attr('x', m.left + w / 2)
        .attr('y', height - 4)
        .attr('text-anchor', 'middle')
        .attr('fill', ui.textMuted)
        .attr('font-size', 11)
        .text(spec.xAxisLabel);
    }
    if (spec.yAxisLabel) {
      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(m.top + h / 2))
        .attr('y', 14)
        .attr('text-anchor', 'middle')
        .attr('fill', ui.textMuted)
        .attr('font-size', 11)
        .text(spec.yAxisLabel);
    }
    return;
  }

  const binKeys = bins.map((_, i) => String(i));
  const xBand = scaleBand<string>().domain(binKeys).range([0, w]).padding(0.14);
  const bandW = xBand.bandwidth();
  const yMax = max(bins, (b) => b.length) ?? 1;
  const yPad = spec.barShowValueLabels ? 1.12 : 1.05;
  const yScale = scaleLinear().domain([0, yMax * yPad]).nice().range([h, 0]);

  if (spec.showGrid !== false) {
    g.append('g')
      .attr('class', 'grid')
      .call(axisLeft(yScale).tickSize(-w).tickFormat(() => ''))
      .call((sel) => sel.selectAll('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', ui.border).attr('stroke-opacity', 0.35));
  }

  g.selectAll<SVGRectElement, (typeof bins)[number]>('rect.hist-bar')
    .data(bins)
    .join(
      (enter) =>
        enter
          .append('rect')
          .attr('class', 'hist-bar')
          .attr('opacity', 0.88)
          .attr('stroke-width', 0.5),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr('fill', (d, i) => resolveHistogramBarFill(spec, i, d.x0, d.x1))
    .attr('stroke', (d, i) => resolveHistogramBarFill(spec, i, d.x0, d.x1))
    .attr('x', (_, i) => xBand(String(i)) ?? 0)
    .attr('width', bandW)
    .attr('y', (d) => (d.length > 0 ? yScale(d.length) : h))
    .attr('height', (d) => (d.length > 0 ? h - yScale(d.length) : 0))
    .each(function (d, i) {
      attachBinPayload(this, d, i);
    });

  if (spec.barShowValueLabels) {
    const labelFs = spec.barValueLabelFontSize ?? 8;
    g.selectAll<SVGTextElement, { bin: (typeof bins)[number]; index: number }>('text.hist-bar-label')
      .data(
        bins
          .map((bin, index) => ({ bin, index }))
          .filter(({ bin }) => bin.length > 0)
      )
      .join(
        (enter) =>
          enter
            .append('text')
            .attr('class', 'hist-bar-label')
            .attr('fill', ui.textMuted)
            .attr('font-size', labelFs)
            .attr('pointer-events', 'none')
            .attr('text-anchor', 'middle'),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('x', ({ index }) => (xBand(String(index)) ?? 0) + bandW / 2)
      .attr('y', ({ bin }) => yScale(bin.length) - 4)
      .text(({ bin }) => new Intl.NumberFormat('en-IN').format(bin.length));
  }

  const yAxis = g.append('g').attr('class', 'axis axis-y');
  yAxis.call(axisLeft(yScale).ticks(5).tickFormat(d3Format('~s')));
  yAxis.selectAll('text').attr('fill', ui.textMuted).attr('font-size', 10);
  yAxis.selectAll('line, path').attr('stroke', ui.border);

  const xAxis = g.append('g').attr('class', 'axis axis-x').attr('transform', `translate(0,${h})`);
  xAxis.selectAll('line, path').attr('stroke', ui.border);
  xAxis
    .selectAll<SVGTextElement, (typeof bins)[number]>('text.hist-x-label')
    .data(bins)
    .join(
      (enter) =>
        enter
          .append('text')
          .attr('class', 'hist-x-label')
          .attr('fill', ui.textMuted)
          .attr('font-size', 8)
          .attr('text-anchor', 'end'),
      (update) => update,
      (exit) => exit.remove()
    )
    .attr('x', (_, i) => (xBand(String(i)) ?? 0) + bandW / 2)
    .attr('y', 0)
    .attr('transform', (_, i) => {
      const cx = (xBand(String(i)) ?? 0) + bandW / 2;
      return `rotate(-35, ${cx}, 0)`;
    })
    .attr('dx', '-0.2em')
    .attr('dy', '0.8em')
    .text((d) => formatBinRangeLabel(d));

  if (spec.xAxisLabel) {
    svg
      .append('text')
      .attr('x', m.left + w / 2)
      .attr('y', height - 4)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', 11)
      .text(spec.xAxisLabel);
  }
  if (spec.yAxisLabel) {
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(m.top + h / 2))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', 11)
      .text(spec.yAxisLabel);
  }
}

function renderCartesianSvg(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const animate = shouldAnimate(ctx);
  const durationMs = transitionMs(spec);
  const t = chartTransition(animate, durationMs);
  const { w, h, m } = innerSize(spec, width, height);
  const horizontal =
    spec.horizontal ?? (spec.chartType === 'horizontal-bar' || spec.chartType === 'stacked-horizontal-bar');
  const categories = spec.categories ?? [];
  const series = spec.series ?? [{ name: 'Series', data: [] }];
  const colors = spec.colors ?? DEFAULT_SERIES_COLORS;

  const svg = ensureChartSvg(container, width, height, !animate);
  let g = svg.select<SVGGElement>('g.cartesian-plot');
  if (g.empty()) {
    g = svg.append('g').attr('class', 'cartesian-plot').attr('transform', `translate(${m.left},${m.top})`);
  } else if (t) {
    transitionSelection(g, t).attr('transform', `translate(${m.left},${m.top})`);
  } else {
    g.attr('transform', `translate(${m.left},${m.top})`);
  }
  if (animate) {
    g.selectAll('.axis, .grid').remove();
    svg.selectAll('.chart-title').remove();
  } else {
    g.selectAll('*').remove();
    svg.selectAll('.chart-title').remove();
  }

  if (spec.title) {
    svg
      .append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textPrimary)
      .attr('font-size', 14)
      .text(spec.title);
  }

  const catScale = scaleBand().domain(categories).range(horizontal ? [0, h] : [0, w]).padding(0.2);
  const allValues: number[] = [];
  series.forEach((s) => asPoints(s.data).forEach((p) => allValues.push(p.value)));
  const yMax = max(allValues) ?? 1;
  const yMin = spec.chartType === 'negative-bar' ? min(allValues) ?? 0 : 0;
  const valueDomainMax =
    yMax *
    (spec.barShowValueLabels ? (horizontal ? 1.15 : 1.1) : 1.05);
  const valScale = scaleLinear().domain([Math.min(0, yMin), valueDomainMax]).range(horizontal ? [0, w] : [h, 0]);

  if (spec.showGrid !== false) {
    g.append('g')
      .attr('class', 'grid')
      .call(
        axisLeft(valScale)
          .tickSize(horizontal ? -w : -h)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', ui.border)
      .attr('stroke-opacity', 0.4);
    g.select('.grid .domain').remove();
  }

  const labelMax = spec.xCategoryLabelMaxLen ?? 14;
  const catAxis = horizontal ? axisLeft(catScale) : axisBottom(catScale);
  const valAxis = horizontal ? axisBottom(valScale) : axisLeft(valScale);
  if (!horizontal) {
    catAxis.tickFormat((d) => truncateCategoryLabel(String(d), labelMax));
  } else if (labelMax > 0) {
    catAxis.tickFormat((d) => truncateCategoryLabel(String(d), labelMax));
  }

  const catLabelFontSize = spec.xCategoryLabelFontSize ?? 10;
  const valTickFontSize = spec.yAxisTickFontSize ?? 10;
  const xAxisG = g
    .append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', horizontal ? '' : `translate(0,${h})`)
    .call(catAxis);
  xAxisG.selectAll('text').attr('fill', ui.textMuted).attr('font-size', catLabelFontSize);
  styleAxisDomain(xAxisG, ui.border);
  if (!horizontal && spec.xCategoryLabelRotate) {
    xAxisG
      .selectAll('text')
      .attr('transform', `rotate(-${spec.xCategoryLabelRotate})`)
      .style('text-anchor', 'end')
      .attr('dx', '-0.35em')
      .attr('dy', '0.32em');
  }

  const yAxisG = g
    .append('g')
    .attr('class', 'axis axis--y')
    .attr('transform', horizontal ? `translate(0,${h})` : '')
    .call(valAxis);
  yAxisG.selectAll('text').attr('fill', ui.textMuted).attr('font-size', valTickFontSize);
  styleAxisDomain(yAxisG, ui.border);

  if (spec.yAxisLabel && !horizontal) {
    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(m.top + h / 2))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', valTickFontSize + 1)
      .text(spec.yAxisLabel);
  }

  if (spec.xAxisLabel && !horizontal) {
    svg
      .append('text')
      .attr('x', m.left + w / 2)
      .attr('y', m.top + h + (spec.xCategoryLabelRotate ? 52 : 36))
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', valTickFontSize + 1)
      .text(spec.xAxisLabel);
  }

  const stackKeys = series.map((s, i) => s.name ?? `s${i}`);
  const stackedData =
    spec.stacked || spec.chartType.startsWith('stacked')
      ? stack().keys(stackKeys)(
          categories.map((cat, ci) => {
            const row: Record<string, number> = { category: ci as unknown as number };
            series.forEach((s, si) => {
              const pt = asPoints(s.data)[ci];
              row[stackKeys[si]] = pt?.value ?? 0;
            });
            return row;
          }) as Iterable<Record<string, number>>
        )
      : null;

  if (stackedData) {
    const seriesCount = series.length;
    const subScale = scaleBand().domain(stackKeys).range([0, catScale.bandwidth()!]).padding(0.1);
    const colorScale = scaleOrdinal<string>().domain(stackKeys).range(colors);
    stackedData.forEach((layer, li) => {
      g.selectAll(`.bar-${li}`)
        .data(layer)
        .join('rect')
        .attr('class', `bar-${li}`)
        .attr('x', (d, i) => {
          const base = horizontal ? valScale(d[0]) : catScale(categories[i])! + subScale(stackKeys[li])!;
          return horizontal ? base : base;
        })
        .attr('y', (d, i) => {
          if (horizontal) {
            return catScale(categories[i])! + subScale(stackKeys[li])!;
          }
          return valScale(d[1]);
        })
        .attr('width', (d) => (horizontal ? valScale(d[1])! - valScale(d[0])! : subScale.bandwidth()!))
        .attr('height', (d, i) => {
          if (horizontal) {
            return subScale.bandwidth()!;
          }
          return h - valScale(d[1])!;
        })
        .attr('fill', colorScale(stackKeys[li]))
        .attr('opacity', (d, i) => (series[li]?.dimmed ? spec.dimOpacity ?? 0.25 : 1))
        .each(function (d, i) {
          attachInteractive(select(this), spec, { name: categories[i], value: d[1] - d[0] }, stackKeys[li], i, onClick, onDblClick);
        });
    });
    return;
  }

  const barWidth = catScale.bandwidth()! / Math.max(1, series.length);
  const barKey = (d: ChartPoint, i: number) => String(d.name ?? categories[i] ?? i);

  series.forEach((s, si) => {
    const pts = asPoints(s.data);
    const color = s.color ?? colors[si % colors.length];
    g.selectAll<SVGRectElement, ChartPoint>(`.bar-${si}`)
      .data(pts, barKey)
      .join(
        (enter) => {
          const rects = enter
            .append('rect')
            .attr('class', `bar-${si}`)
            .attr('fill', (_, i) => resolveBarPointFill(spec, pts[i]!, i, color))
            .attr('opacity', (_, i) => {
              const style = (pts[i] as ChartPoint & { itemStyle?: { opacity?: number } }).itemStyle;
              if (style?.opacity !== undefined) {
                return style.opacity;
              }
              return s.dimmed ? spec.dimOpacity ?? 0.25 : 1;
            });
          if (horizontal) {
            rects
              .attr('x', valScale(0))
              .attr('y', (_, i) => catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0)
              .attr('width', 0)
              .attr('height', barWidth);
          } else {
            rects
              .attr('x', (_, i) => (catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0) + si * barWidth)
              .attr('y', h)
              .attr('width', barWidth)
              .attr('height', 0);
          }
          const target = (sel: typeof rects) => {
            sel
              .attr('x', (_, i) => {
                const cat = catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0;
                return horizontal ? valScale(Math.min(0, pts[i].value)) : cat + si * barWidth;
              })
              .attr('y', (_, i) => {
                const v = pts[i].value;
                return horizontal ? catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0 : valScale(Math.max(0, v));
              })
              .attr('width', (_, i) => {
                const v = pts[i].value;
                return horizontal ? Math.abs(valScale(v)! - valScale(0)!) : barWidth;
              })
              .attr('height', (_, i) => {
                const v = pts[i].value;
                return horizontal ? barWidth : Math.abs(h - valScale(v)!);
              });
          };
          if (t) {
            transitionSelection(rects, t).call(target);
          } else {
            target(rects);
          }
          rects.each(function (d, i) {
            attachInteractive(select(this), spec, d, s.name, i, onClick, onDblClick);
          });
          return rects;
        },
        (update) => {
          const apply = (sel: typeof update) => {
            sel
              .attr('fill', (_, i) => resolveBarPointFill(spec, pts[i]!, i, color))
              .attr('opacity', (_, i) => {
                const style = (pts[i] as ChartPoint & { itemStyle?: { opacity?: number } }).itemStyle;
                if (style?.opacity !== undefined) {
                  return style.opacity;
                }
                return s.dimmed ? spec.dimOpacity ?? 0.25 : 1;
              })
              .attr('x', (_, i) => {
                const cat = catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0;
                return horizontal ? valScale(Math.min(0, pts[i].value)) : cat + si * barWidth;
              })
              .attr('y', (_, i) => {
                const v = pts[i].value;
                return horizontal ? catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0 : valScale(Math.max(0, v));
              })
              .attr('width', (_, i) => {
                const v = pts[i].value;
                return horizontal ? Math.abs(valScale(v)! - valScale(0)!) : barWidth;
              })
              .attr('height', (_, i) => {
                const v = pts[i].value;
                return horizontal ? barWidth : Math.abs(h - valScale(v)!);
              });
          };
          if (t) {
            transitionSelection(update, t).call(apply);
          } else {
            apply(update);
          }
          update.each(function (d, i) {
            attachInteractive(select(this), spec, d, s.name, i, onClick, onDblClick);
          });
          return update;
        },
        (exit) => {
          if (t) {
            if (horizontal) {
              transitionSelection(exit, t).attr('width', 0).remove();
            } else {
              transitionSelection(exit, t).attr('y', h).attr('height', 0).remove();
            }
          } else {
            exit.remove();
          }
        }
      );

    if (spec.barShowValueLabels) {
      const barLabelFs = spec.barValueLabelFontSize ?? 10;
      const labelKey = (d: ChartPoint, i: number) => String(d.name ?? categories[i] ?? i);
      g.selectAll<SVGTextElement, ChartPoint>(`.bar-value-label-${si}`)
        .data(pts, labelKey)
        .join(
          (enter) => {
            const labels = enter
              .append('text')
              .attr('class', `bar-value-label-${si}`)
              .attr('fill', ui.textMuted)
              .attr('font-size', barLabelFs)
              .attr('pointer-events', 'none');
            if (horizontal) {
              labels
                .attr('x', (_, i) => valScale(pts[i].value) + 4)
                .attr('y', (_, i) => (catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0) + barWidth / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'start')
                .text((d) => formatBarValueLabel(spec, d.value));
            } else {
              labels
                .attr('x', (_, i) => {
                  const cat = catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0;
                  return cat + si * barWidth + barWidth / 2;
                })
                .attr('y', (_, i) => valScale(pts[i].value) - 4)
                .attr('text-anchor', 'middle')
                .text((d) => formatBarValueLabel(spec, d.value));
            }
            return labels;
          },
          (update) => {
            const apply = (sel: typeof update) => {
              if (horizontal) {
                sel
                  .attr('x', (_, i) => valScale(pts[i].value) + 4)
                  .attr('y', (_, i) => (catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0) + barWidth / 2)
                  .text((d) => formatBarValueLabel(spec, d.value));
              } else {
                sel
                  .attr('x', (_, i) => {
                    const cat = catScale(categories[i] ?? pts[i]?.name ?? String(i)) ?? 0;
                    return cat + si * barWidth + barWidth / 2;
                  })
                  .attr('y', (_, i) => valScale(pts[i].value) - 4)
                  .text((d) => formatBarValueLabel(spec, d.value));
              }
            };
            if (t) {
              transitionSelection(update, t).call(apply);
            } else {
              apply(update);
            }
            return update;
          },
          (exit) => exit.remove()
        );
    }
  });
}

function renderLineAreaSvg(ctx: RenderContext, filled: boolean): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const { w, h, m } = innerSize(spec, width, height);
  const categories = spec.categories ?? [];
  const series = spec.series ?? [];
  const colors = spec.colors ?? DEFAULT_SERIES_COLORS;

  clearContainer(container);
  const svg = select(container).append('svg').attr('width', width).attr('height', height);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const x = scaleBand().domain(categories).range([0, w]).padding(0.1);
  const allVals = series.flatMap((s) => asPoints(s.data).map((p) => p.value));
  const y = scaleLinear().domain([0, (max(allVals) ?? 1) * 1.05]).range([h, 0]);

  g.append('g').attr('transform', `translate(0,${h})`).call(axisBottom(x));
  g.append('g').call(axisLeft(y));

  series.forEach((s, si) => {
    const pts = asPoints(s.data);
    const lineGen = line<ChartPoint>()
      .x((_, i) => x(categories[i] ?? String(i))! + x.bandwidth()! / 2)
      .y((d) => y(d.value));
    const color = s.color ?? colors[si % colors.length];
    if (filled) {
      const areaGen = d3Area<ChartPoint>()
        .x((_, i) => x(categories[i] ?? String(i))! + x.bandwidth()! / 2)
        .y0(h)
        .y1((d) => y(d.value));
      g.append('path').datum(pts).attr('fill', color).attr('opacity', 0.35).attr('d', areaGen);
    }
    g.append('path').datum(pts).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 2).attr('d', lineGen);
    g.selectAll(`.dot-${si}`)
      .data(pts)
      .join('circle')
      .attr('cx', (_, i) => x(categories[i] ?? String(i))! + x.bandwidth()! / 2)
      .attr('cy', (d) => y(d.value))
      .attr('r', 4)
      .attr('fill', color)
      .each(function (d, i) {
        attachInteractive(select(this), spec, d, s.name, i, onClick, onDblClick);
      });
  });
}

type PieArcDatum = ReturnType<ReturnType<typeof pie<ChartPoint>>>[0];

function pieSliceKey(d: PieArcDatum): string {
  return String((d.data as ChartPoint).name ?? d.index);
}

function renderPieOutsideLabels(
  g: Selection<SVGGElement, unknown, null, undefined>,
  spec: D3ChartSpec,
  arcs: PieArcDatum[],
  radius: number,
  minAngle: number,
  total: number,
  animate: boolean,
  durationMs: number,
  ui: ReturnType<typeof getMoneytreeChartUiColors>
): void {
  if (spec.pieLabelsOutside === false) {
    g.selectAll('.pie-labels').remove();
    return;
  }

  const maxLabels = spec.pieMaxOutsideLabels ?? 8;
  const ranked = [...arcs]
    .map((a, i) => ({ a, i, v: (a.data as ChartPoint).value }))
    .sort((p, q) => q.v - p.v)
    .slice(0, maxLabels)
    .filter(({ a }) => a.endAngle - a.startAngle >= minAngle);

  const labelArc = arc<PieArcDatum>().innerRadius(radius * 1.02).outerRadius(radius * 1.02);
  const labelMax = spec.xCategoryLabelMaxLen ?? 12;
  const showPct = spec.pieLabelShowPercent !== false;
  const lineEnd = radius * 1.04;
  const labelR = radius * 1.12;
  const t = chartTransition(animate, durationMs);

  const labelRoot = g.selectAll<SVGGElement, null>('.pie-labels').data([null]);
  labelRoot.join(
    (enter) => enter.append('g').attr('class', 'pie-labels').style('pointer-events', 'none'),
    (update) => update,
    (exit) => {
      if (t) {
        transitionSelection(exit, t).style('opacity', 0).remove();
      } else {
        exit.remove();
      }
    }
  );

  const labelGroup = g.select<SVGGElement>('.pie-labels');
  labelGroup
    .selectAll<SVGGElement, (typeof ranked)[0]>('g.pie-label-item')
    .data(ranked, (d) => String((d.a.data as ChartPoint).name ?? d.i))
    .join(
      (enter) => {
        const item = enter
          .append('g')
          .attr('class', 'pie-label-item')
          .style('opacity', animate ? 0 : 1);
        item.each(function ({ a }) {
          const pt = labelArc.centroid(a);
          const name = truncateCategoryLabel(String(a.data.name ?? ''), labelMax);
          const pct =
            total > 0 ? (((a.data as ChartPoint).value / total) * 100).toFixed(0) : '0';
          const labelText = showPct ? `${name} (${pct}%)` : name;
          const mid = (a.startAngle + a.endAngle) / 2;
          const lx = Math.cos(mid - Math.PI / 2);
          const ly = Math.sin(mid - Math.PI / 2);
          const anchor = lx > 0 ? 'start' : 'end';
          const host = select(this);
          host
            .append('polyline')
            .attr('class', 'pie-label-line')
            .attr('points', `${pt[0]},${pt[1]} ${lx * lineEnd},${ly * lineEnd} ${lx * labelR},${ly * labelR}`)
            .attr('fill', 'none')
            .attr('stroke', ui.textMuted)
            .attr('stroke-width', 1);
          host
            .append('text')
            .attr('class', 'pie-label-text')
            .attr('x', lx * labelR)
            .attr('y', ly * labelR)
            .attr('text-anchor', anchor)
            .attr('dominant-baseline', 'middle')
            .attr('fill', ui.textPrimary)
            .attr('font-size', 10)
            .text(labelText);
        });
        if (t) {
          transitionSelection(item, t).style('opacity', 1);
        }
        return item;
      },
      (update) => {
        update.each(function ({ a }) {
          const pt = labelArc.centroid(a);
          const name = truncateCategoryLabel(String(a.data.name ?? ''), labelMax);
          const pct =
            total > 0 ? (((a.data as ChartPoint).value / total) * 100).toFixed(0) : '0';
          const labelText = showPct ? `${name} (${pct}%)` : name;
          const mid = (a.startAngle + a.endAngle) / 2;
          const lx = Math.cos(mid - Math.PI / 2);
          const ly = Math.sin(mid - Math.PI / 2);
          const anchor = lx > 0 ? 'start' : 'end';
          const host = select(this);
          const lineSel = host.select<SVGPolylineElement>('.pie-label-line');
          const textSel = host.select<SVGTextElement>('.pie-label-text');
          const points = `${pt[0]},${pt[1]} ${lx * lineEnd},${ly * lineEnd} ${lx * labelR},${ly * labelR}`;
          if (t && !lineSel.empty() && !textSel.empty()) {
            transitionSelection(lineSel, t).attr('points', points);
            transitionSelection(textSel, t)
              .attr('x', lx * labelR)
              .attr('y', ly * labelR)
              .attr('text-anchor', anchor)
              .text(labelText);
          } else {
            lineSel.attr('points', points);
            textSel.attr('x', lx * labelR).attr('y', ly * labelR).attr('text-anchor', anchor).text(labelText);
          }
        });
        return update;
      },
      (exit) => {
        if (t) {
          transitionSelection(exit, t).style('opacity', 0).remove();
        } else {
          exit.remove();
        }
      }
    );
}

function renderPieSvg(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const animate = shouldAnimate(ctx);
  const durationMs = transitionMs(spec);
  const t = chartTransition(animate, durationMs);
  const { w, h, m } = innerSize(spec, width, height);
  const svg = ensureChartSvg(container, width, height, !animate);
  const outside = spec.pieLabelsOutside !== false;
  const compact = Math.min(w, h) < 220;
  const labelReserve = outside ? 16 : 8;
  const maxR = Math.min(w / 2 - 2, h / 2 - labelReserve);
  const defaultFactor = outside ? (compact ? 0.58 : 0.65) : 0.86;
  const factor = spec.pieRadiusFactor ?? defaultFactor;
  const radius = maxR * Math.min(1, factor);
  const innerR = radius * (spec.pieInnerRadius ?? 0);
  const cx = m.left + w / 2;
  const cy = m.top + h / 2;

  let g = svg.select<SVGGElement>('g.pie-root');
  if (g.empty()) {
    g = svg.append('g').attr('class', 'pie-root').attr('transform', `translate(${cx},${cy})`);
  } else if (t) {
    transitionSelection(g, t).attr('transform', `translate(${cx},${cy})`);
  } else {
    g.attr('transform', `translate(${cx},${cy})`);
  }

  const data = asPoints(spec.series?.[0]?.data ?? []);
  const colors = spec.colors ?? DEFAULT_SERIES_COLORS;
  const pieGen = pie<ChartPoint>().value((d) => d.value).sort(null);
  const arcs = pieGen(data);
  const total = sum(arcs, (a) => (a.data as ChartPoint).value) ?? 0;
  const arcGen = arc<PieArcDatum>().innerRadius(innerR).outerRadius(radius);
  const minAngle = ((spec.pieMinLabelAngle ?? 6) * Math.PI) / 180;

  const collapsedArc = (d: PieArcDatum) => arcGen({ ...d, endAngle: d.startAngle })!;

  g.selectAll<SVGPathElement, PieArcDatum>('path.slice')
    .data(arcs, pieSliceKey)
    .join(
      (enter) => {
        const paths = enter
          .append('path')
          .attr('class', 'slice')
          .attr('fill', (d) => {
            const i = arcs.indexOf(d);
            const style = (data[i] as ChartPoint & { itemStyle?: { color?: string } })?.itemStyle;
            return style?.color ?? colors[i % colors.length];
          })
          .attr('stroke', (d) => {
            const i = arcs.indexOf(d);
            const style = (data[i] as ChartPoint & { itemStyle?: { borderColor?: string } })?.itemStyle;
            return style?.borderColor ?? ui.border;
          })
          .attr('stroke-width', (d) => {
            const i = arcs.indexOf(d);
            const style = (data[i] as ChartPoint & { itemStyle?: { borderWidth?: number } })?.itemStyle;
            return style?.borderWidth ?? 1;
          })
          .attr('d', (d) => (animate ? collapsedArc(d) : arcGen(d)!))
          .attr('opacity', (d) => {
            const style = (d.data as ChartPoint & { itemStyle?: { opacity?: number } }).itemStyle;
            return style?.opacity ?? 1;
          });
        if (t) {
          transitionSelection(paths, t).attr('d', (d: PieArcDatum) => arcGen(d)!);
        }
        paths.each(function (d, i) {
          attachInteractive(select(this), spec, d.data, spec.series?.[0]?.name, i, onClick, onDblClick);
        });
        return paths;
      },
      (update) => {
        if (t) {
          transitionSelection(update, t).attr('d', (d: PieArcDatum) => arcGen(d)!);
        } else {
          update.attr('d', (d: PieArcDatum) => arcGen(d)!);
        }
        update
          .attr('fill', (d) => {
            const i = arcs.indexOf(d);
            const style = (data[i] as ChartPoint & { itemStyle?: { color?: string } })?.itemStyle;
            return style?.color ?? colors[i % colors.length];
          })
          .attr('opacity', (d) => {
            const style = (d.data as ChartPoint & { itemStyle?: { opacity?: number } }).itemStyle;
            return style?.opacity ?? 1;
          });
        update.each(function (d, i) {
          attachInteractive(select(this), spec, d.data, spec.series?.[0]?.name, i, onClick, onDblClick);
        });
        return update;
      },
      (exit) => {
        if (t) {
          transitionSelection(exit, t).style('opacity', 0).remove();
        } else {
          exit.remove();
        }
      }
    );

  renderPieOutsideLabels(g, spec, arcs, radius, minAngle, total, animate, durationMs, ui);
}

type ScatterPlotPoint = ChartPoint & {
  x?: number;
  value?: number | number[];
  symbolSize?: number;
  itemStyle?: { color?: string; opacity?: number };
};

function scatterCoords(p: ScatterPlotPoint): { x: number; y: number; r: number } {
  if (Array.isArray(p.value)) {
    return {
      x: Number(p.value[0]),
      y: Number(p.value[1]),
      r: Math.max(3, (p.symbolSize ?? 8) / 2),
    };
  }
  const yVal = (p as ScatterPlotPoint & { y?: number }).y ?? p.value;
  return {
    x: Number(p.x ?? 0),
    y: Number(yVal ?? 0),
    r: Math.max(3, (p.symbolSize ?? 8) / 2),
  };
}

type ScatterDatum = {
  x: number;
  y: number;
  r: number;
  raw: ChartPoint;
  seriesName?: string;
};

function scatterPointKey(d: ScatterDatum): string {
  const r = d.raw as ScatterPlotPoint & { tradingsymbol?: string; name?: string; pointId?: string };
  return (r.pointId ?? r.tradingsymbol ?? r.name ?? `${d.x}|${d.y}|${d.r}`).trim();
}

function linearDomainIncludesZero(domain: [number, number]): boolean {
  const lo = Math.min(domain[0], domain[1]);
  const hi = Math.max(domain[0], domain[1]);
  return lo <= 0 && hi >= 0;
}

function appendScatterPlotFrame(
  g: Selection<SVGGElement, unknown, null, undefined>,
  w: number,
  h: number,
  stroke: string
): void {
  g.append('rect')
    .attr('class', 'scatter-plot-frame')
    .attr('width', w)
    .attr('height', h)
    .attr('fill', 'none')
    .attr('stroke', stroke)
    .attr('stroke-width', 1)
    .attr('pointer-events', 'none');
}

function appendScatterZeroLines(
  g: Selection<SVGGElement, unknown, null, undefined>,
  xScale: ReturnType<typeof scaleLinear>,
  yScale: ReturnType<typeof scaleLinear>,
  w: number,
  h: number,
  stroke: string
): void {
  const zeroG = g.append('g').attr('class', 'scatter-zero-lines');
  const xDom = xScale.domain() as [number, number];
  const yDom = yScale.domain() as [number, number];
  if (linearDomainIncludesZero(xDom)) {
    const x0 = Number(xScale(0));
    zeroG
      .append('line')
      .attr('class', 'scatter-zero-line scatter-zero-line--x')
      .attr('x1', x0)
      .attr('x2', x0)
      .attr('y1', 0)
      .attr('y2', h)
      .attr('stroke', stroke)
      .attr('stroke-width', 1.5)
      .attr('pointer-events', 'none');
  }
  if (linearDomainIncludesZero(yDom)) {
    const y0 = Number(yScale(0));
    zeroG
      .append('line')
      .attr('class', 'scatter-zero-line scatter-zero-line--y')
      .attr('x1', 0)
      .attr('x2', w)
      .attr('y1', y0)
      .attr('y2', y0)
      .attr('stroke', stroke)
      .attr('stroke-width', 1.5)
      .attr('pointer-events', 'none');
  }
}

function upsertScatterClip(
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  w: number,
  h: number
): string {
  let clipId = svg.attr('data-scatter-clip-id');
  if (!clipId) {
    clipId = `scatter-clip-${Math.random().toString(36).slice(2, 9)}`;
    svg.attr('data-scatter-clip-id', clipId);
  }
  let defs = svg.select<SVGDefsElement>('defs.scatter-defs');
  if (defs.empty()) {
    defs = svg.append('defs').attr('class', 'scatter-defs');
  }
  let clip = defs.select<SVGClipPathElement>(`clipPath#${clipId}`);
  if (clip.empty()) {
    clip = defs.append('clipPath').attr('id', clipId);
    clip.append('rect');
  }
  clip.select('rect').attr('width', w).attr('height', h);
  return clipId;
}

function renderScatterSvg(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const animate = shouldAnimate(ctx);
  const durationMs = transitionMs(spec);
  const t = chartTransition(animate, durationMs);
  const { w, h, m } = scatterInnerSize(spec, width, height);
  const domainPad = spec.scatterDomainPaddingPercent ?? DEFAULT_SCATTER_DOMAIN_PADDING_PERCENT;
  const series = spec.series ?? [];
  const allPts = series.flatMap((s) =>
    asPoints(s.data).map((p) => ({
      ...scatterCoords(p as ScatterPlotPoint),
      raw: p,
      seriesName: s.name,
    }))
  );
  if (!allPts.length) {
    if (!animate) {
      clearContainer(container);
    }
    return;
  }
  const xMin = min(allPts, (d) => d.x)!;
  const xMax = max(allPts, (d) => d.x)!;
  const yMin = min(allPts, (d) => d.y)!;
  const yMax = max(allPts, (d) => d.y)!;
  const xDomain = spec.scatterXDomain ?? paddedScatterDomain(xMin, xMax, domainPad);
  const xScale = scaleLinear().domain(xDomain).range([0, w]);
  const yDomain = spec.scatterYDomain ?? paddedScatterDomain(yMin, yMax, domainPad);
  const yScale = scaleLinear().domain(yDomain).range([h, 0]);

  const svg = ensureChartSvg(container, width, height, !animate);
  const clipId = upsertScatterClip(svg, w, h);

  let g = svg.select<SVGGElement>('g.scatter-plot');
  if (g.empty()) {
    g = svg
      .append('g')
      .attr('class', 'scatter-plot')
      .attr('transform', `translate(${m.left},${m.top})`)
      .style('pointer-events', 'auto');
  } else if (t) {
    transitionSelection(g, t).attr('transform', `translate(${m.left},${m.top})`);
  } else {
    g.attr('transform', `translate(${m.left},${m.top})`);
  }

  if (animate) {
    g.selectAll('.axis, .grid, .scatter-zero-lines, .scatter-plot-frame').remove();
    svg.selectAll('.scatter-label').remove();
  } else {
    g.selectAll('*').remove();
    svg.selectAll('.scatter-label').remove();
  }

  if (spec.showGrid !== false) {
    g.append('g')
      .attr('class', 'grid grid--y')
      .call(
        axisLeft(yScale)
          .tickSize(-w)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', ui.border)
      .attr('stroke-opacity', 0.35);
    g.select('.grid--y .domain').remove();
    g.append('g')
      .attr('class', 'grid grid--x')
      .attr('transform', `translate(0,${h})`)
      .call(
        axisBottom(xScale)
          .tickSize(-h)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', ui.border)
      .attr('stroke-opacity', 0.35);
    g.select('.grid--x .domain').remove();
  }

  if (spec.scatterShowZeroLines !== false) {
    appendScatterZeroLines(g, xScale, yScale, w, h, ui.borderStrong);
  }

  const xAxisG = g
    .append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${h})`)
    .call(
      axisBottom(xScale)
        .ticks(6)
        .tickFormat((v) =>
          spec.scatterXTickFormat ? spec.scatterXTickFormat(Number(v)) : formatAxisNumber(Number(v))
        )
    );
  xAxisG.selectAll('text').attr('fill', ui.textMuted).attr('font-size', 10);
  const showPlotFrame = spec.scatterShowPlotFrame !== false;

  const yAxisG = g
    .append('g')
    .attr('class', 'axis axis--y')
    .call(
      axisLeft(yScale)
        .ticks(6)
        .tickFormat((v) =>
          spec.scatterYTickFormat ? spec.scatterYTickFormat(Number(v)) : formatAxisNumber(Number(v))
        )
    );
  yAxisG.selectAll('text').attr('fill', ui.textMuted).attr('font-size', 10);

  if (showPlotFrame) {
    xAxisG.selectAll('.domain').remove();
    yAxisG.selectAll('.domain').remove();
    xAxisG.selectAll('.tick line').attr('stroke', ui.border);
    yAxisG.selectAll('.tick line').attr('stroke', ui.border);
    appendScatterPlotFrame(g, w, h, ui.border);
  } else {
    styleAxisDomain(xAxisG, ui.border);
    styleAxisDomain(yAxisG, ui.border);
  }

  if (spec.xAxisLabel) {
    const xLabelY = Math.min(m.top + h + 30, height - 10);
    svg
      .append('text')
      .attr('class', 'scatter-label')
      .attr('x', m.left + w / 2)
      .attr('y', xLabelY)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', 11)
      .text(spec.xAxisLabel);
  }
  if (spec.yAxisLabel) {
    svg
      .append('text')
      .attr('class', 'scatter-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(m.top + h / 2))
      .attr('y', m.top + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', 11)
      .text(spec.yAxisLabel);
  }

  let ptsG = g.select<SVGGElement>('g.scatter-points');
  if (ptsG.empty()) {
    ptsG = g.append('g').attr('class', 'scatter-points').attr('clip-path', `url(#${clipId})`);
  } else {
    ptsG.attr('clip-path', `url(#${clipId})`);
  }

  ptsG
    .selectAll<SVGCircleElement, (typeof allPts)[0]>('circle.scatter-pt')
    .data(allPts, scatterPointKey)
    .join(
      (enter) => {
        const circles = enter
          .append('circle')
          .attr('class', 'scatter-pt')
          .attr('cx', (d) => xScale(d.x))
          .attr('cy', (d) => yScale(d.y))
          .attr('r', animate ? 0 : (d) => d.r)
          .attr('fill', (d) => (d.raw as ScatterPlotPoint).itemStyle?.color ?? spec.colors?.[0] ?? DEFAULT_SERIES_COLORS[0])
          .attr('opacity', animate ? 0 : (d) => (d.raw as ScatterPlotPoint).itemStyle?.opacity ?? 0.88)
          .attr('stroke', (d) => {
            const c = (d.raw as ScatterPlotPoint).itemStyle?.color;
            return c ? 'rgba(0,0,0,0.22)' : ui.border;
          })
          .attr('stroke-width', 1);
        if (t) {
          transitionSelection(circles, t)
            .attr('r', (d: ScatterDatum) => d.r)
            .attr('opacity', (d: ScatterDatum) => (d.raw as ScatterPlotPoint).itemStyle?.opacity ?? 0.88);
        }
        circles.each(function (d, i) {
          attachInteractive(select(this), spec, d.raw, d.seriesName, i, onClick, onDblClick);
        });
        return circles;
      },
      (update) => {
        if (t) {
          transitionSelection(update, t)
            .attr('cx', (d: ScatterDatum) => xScale(d.x))
            .attr('cy', (d: ScatterDatum) => yScale(d.y))
            .attr('r', (d: ScatterDatum) => d.r)
            .attr('opacity', (d: ScatterDatum) => (d.raw as ScatterPlotPoint).itemStyle?.opacity ?? 0.88);
        } else {
          update
            .attr('cx', (d: ScatterDatum) => xScale(d.x))
            .attr('cy', (d: ScatterDatum) => yScale(d.y))
            .attr('r', (d: ScatterDatum) => d.r)
            .attr('opacity', (d: ScatterDatum) => (d.raw as ScatterPlotPoint).itemStyle?.opacity ?? 0.88);
        }
        update.each(function (d, i) {
          attachInteractive(select(this), spec, d.raw, d.seriesName, i, onClick, onDblClick);
        });
        return update;
      },
      (exit) => {
        if (t) {
          transitionSelection(exit, t).attr('r', 0).style('opacity', 0).remove();
        } else {
          exit.remove();
        }
      }
    );
}

function renderScatterCanvas(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const { w, h, m } = scatterInnerSize(spec, width, height);
  const domainPad = spec.scatterDomainPaddingPercent ?? DEFAULT_SCATTER_DOMAIN_PADDING_PERCENT;
  clearContainer(container);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx2d = canvas.getContext('2d')!;
  const series = spec.series ?? [];
  const allPts = series.flatMap((s) =>
    asPoints(s.data).map((p) => {
      const c = scatterCoords(p as ScatterPlotPoint);
      return { x: c.x, y: c.y, raw: p, seriesName: s.name };
    })
  );
  const xMin = min(allPts, (d) => d.x) ?? 0;
  const xMax = max(allPts, (d) => d.x) ?? 1;
  const yMin = min(allPts, (d) => d.y) ?? 0;
  const yMax = max(allPts, (d) => d.y) ?? 1;
  const xDomain = spec.scatterXDomain ?? paddedScatterDomain(xMin, xMax, domainPad);
  const xScale = scaleLinear().domain(xDomain).range([m.left, m.left + w]);
  const yDomain = spec.scatterYDomain ?? paddedScatterDomain(yMin, yMax, domainPad);
  const yScale = scaleLinear().domain(yDomain).range([m.top + h, m.top]);
  ctx2d.fillStyle = ui.chartSurface;
  ctx2d.fillRect(0, 0, width, height);
  allPts.forEach((p, i) => {
    const pt = p.raw as ScatterPlotPoint;
    const style = pt.itemStyle;
    ctx2d.beginPath();
    ctx2d.globalAlpha = style?.opacity ?? 0.88;
    ctx2d.fillStyle = style?.color ?? (spec.colors ?? DEFAULT_SERIES_COLORS)[i % DEFAULT_SERIES_COLORS.length];
    const r = Math.max(3, (pt.symbolSize ?? 10) / 2);
    ctx2d.arc(xScale(p.x), yScale(p.y), r, 0, Math.PI * 2);
    ctx2d.fill();
    ctx2d.globalAlpha = 1;
  });
  const pickPoint = (mx: number, my: number) => {
    let best = -1;
    let bestDist = 100;
    allPts.forEach((p, i) => {
      const pt = p.raw as ScatterPlotPoint;
      const r = Math.max(3, (pt.symbolSize ?? 10) / 2);
      const dx = xScale(p.x) - mx;
      const dy = yScale(p.y) - my;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist && d <= r + 4) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const best = pickPoint(mx, my);
    if (best >= 0) {
      const p = allPts[best];
      emitInteraction({ click: onClick, dblclick: onDblClick }, spec.chartType, p.raw, 'click', p.seriesName, best);
    }
  });
  canvas.addEventListener('dblclick', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const best = pickPoint(mx, my);
    if (best >= 0) {
      const p = allPts[best];
      emitInteraction({ click: onClick, dblclick: onDblClick }, spec.chartType, p.raw, 'dblclick', p.seriesName, best);
    }
  });
  canvas.style.cursor = 'default';
  canvas.addEventListener('mousemove', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const best = pickPoint(mx, my);
    if (best >= 0) {
      const p = allPts[best];
      const html = resolveTooltipHtml(spec, p.raw);
      if (html) {
        canvas.style.cursor = 'pointer';
        showChartTooltip(html, ev);
        return;
      }
    }
    canvas.style.cursor = 'default';
    hideChartTooltip();
  });
  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
    hideChartTooltip();
  });
}

function renderGaugeSvg(ctx: RenderContext): void {
  const { container, spec, width, height } = ctx;
  const ui = getMoneytreeChartUiColors();
  clearContainer(container);
  const g = spec.gauge ?? { value: 0, min: 0, max: 100 };
  const { w, h, m } = plotInnerSize(spec, width, height);
  const svg = select(container).append('svg').attr('width', width).attr('height', height);
  const cx = m.left + w / 2;
  const cy = m.top + h / 2;
  const radius = Math.min(w, h) / 2;
  const arcGen = arc().innerRadius(radius * 0.6).outerRadius(radius).startAngle(-Math.PI / 2);
  const pct = (g.value - (g.min ?? 0)) / ((g.max ?? 100) - (g.min ?? 0));
  svg
    .append('g')
    .attr('transform', `translate(${cx},${cy})`)
    .append('path')
    .attr('d', arcGen.endAngle(-Math.PI / 2 + Math.PI * pct) as unknown as string)
    .attr('fill', DEFAULT_SERIES_COLORS[0]);
  svg
    .append('text')
    .attr('x', cx)
    .attr('y', cy)
    .attr('text-anchor', 'middle')
    .attr('fill', ui.textPrimary)
    .text(formatValue(spec, g.value));
}

function parseHeatmapIsoDay(iso: string): Date | null {
  const m = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    return null;
  }
  return new Date(+m[1]!, +m[2]! - 1, +m[3]!);
}

function startOfWeekSunday(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function renderCalendarHeatmapSvg(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const cells = (spec.heatmapCells ?? []).filter((c) => c.dayIso || c.bankDay);
  clearContainer(container);
  if (!cells.length || width < 40 || height < 40) {
    return;
  }

  const parsed = cells
    .map((c) => {
      const iso = String(c.dayIso ?? c.bankDay ?? '');
      const d = parseHeatmapIsoDay(iso);
      return d ? { cell: c, date: d, iso } : null;
    })
    .filter((x): x is { cell: (typeof cells)[0]; date: Date; iso: string } => x != null);
  if (!parsed.length) {
    return;
  }

  const minT = min(parsed, (p) => p.date.getTime())!;
  const maxT = max(parsed, (p) => p.date.getTime())!;
  const gridStart = startOfWeekSunday(new Date(minT));
  const maxDate = new Date(maxT);
  const msDay = 86_400_000;
  const lastCol = Math.floor((maxDate.getTime() - gridStart.getTime()) / (7 * msDay));
  const numWeeks = lastCol + 1;

  const m = resolveChartMargin(spec, width, height);
  const gap = 2;
  const legendReserve = 28;
  const dowLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const plotW = Math.max(10, width - m.left - m.right);
  const plotH = Math.max(10, height - m.top - m.bottom - legendReserve);
  const cellSize = Math.max(
    3,
    Math.min((plotW - gap * Math.max(0, numWeeks - 1)) / numWeeks, (plotH - gap * 6) / 7)
  );
  const gridW = numWeeks * cellSize + Math.max(0, numWeeks - 1) * gap;
  const gridH = 7 * cellSize + 6 * gap;
  const offsetX = m.left + Math.max(0, (plotW - gridW) / 2);
  const offsetY = m.top + Math.max(0, (plotH - gridH) / 2);

  const values = parsed.map((p) => Number(p.cell.value));
  const maxV = max(values) ?? 1;
  const rangeColors =
    spec.colors && spec.colors.length >= 2 ? spec.colors : ['#fee2e2', '#450a0a'];
  const colorScale = scaleLinear<string>()
    .domain([0, maxV])
    .range([rangeColors[0]!, rangeColors[rangeColors.length - 1]!])
    .interpolate(interpolateRgb);

  const svg = select(container).append('svg').attr('width', width).attr('height', height);

  for (let dow = 0; dow < 7; dow++) {
    svg
      .append('text')
      .attr('x', offsetX - 6)
      .attr('y', offsetY + dow * (cellSize + gap) + cellSize / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', ui.textMuted)
      .attr('font-size', 9)
      .text(dowLabels[dow]!);
  }

  let prevMonth = '';
  for (let w = 0; w < numWeeks; w++) {
    const weekDate = new Date(gridStart.getTime() + w * 7 * msDay);
    const monthLabel = weekDate.toLocaleDateString('en-IN', { month: 'short' });
    if (monthLabel !== prevMonth) {
      svg
        .append('text')
        .attr('x', offsetX + w * (cellSize + gap) + cellSize / 2)
        .attr('y', offsetY - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', ui.textMuted)
        .attr('font-size', 9)
        .text(monthLabel);
      prevMonth = monthLabel;
    }
  }

  for (const { cell, date, iso } of parsed) {
    const col = Math.floor((date.getTime() - gridStart.getTime()) / (7 * msDay));
    const row = date.getDay();
    const x = offsetX + col * (cellSize + gap);
    const y = offsetY + row * (cellSize + gap);
    const payload = { ...cell, dayIso: iso, bankDay: iso, value: Number(cell.value) };
    svg
      .append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('rx', 1)
      .attr('fill', colorScale(Number(cell.value)) as string)
      .each(function () {
        attachInteractive(select(this), spec, payload, undefined, undefined, onClick, onDblClick);
      });
  }

  const legendW = Math.min(220, plotW * 0.55);
  const legendH = 8;
  const legendX = m.left + (plotW - legendW) / 2;
  const legendY = height - m.bottom + 8;
  const legendSteps = 24;
  for (let i = 0; i < legendSteps; i++) {
    const t0 = i / (legendSteps - 1);
    const v = maxV * t0;
    svg
      .append('rect')
      .attr('x', legendX + (legendW * i) / legendSteps)
      .attr('y', legendY)
      .attr('width', legendW / legendSteps + 1)
      .attr('height', legendH)
      .attr('fill', colorScale(v) as string);
  }
  const fmt = (v: number) => (spec.valueFormatter ? spec.valueFormatter(v) : String(v));
  svg
    .append('text')
    .attr('x', legendX)
    .attr('y', legendY + legendH + 12)
    .attr('text-anchor', 'start')
    .attr('fill', ui.textMuted)
    .attr('font-size', 9)
    .text(fmt(0));
  svg
    .append('text')
    .attr('x', legendX + legendW)
    .attr('y', legendY + legendH + 12)
    .attr('text-anchor', 'end')
    .attr('fill', ui.textMuted)
    .attr('font-size', 9)
    .text(fmt(maxV));
  svg
    .append('text')
    .attr('x', legendX + legendW / 2)
    .attr('y', legendY - 4)
    .attr('text-anchor', 'middle')
    .attr('fill', ui.textMuted)
    .attr('font-size', 9)
    .text('Daily activity');
}

function renderHeatmapCanvas(ctx: RenderContext): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const cells = spec.heatmapCells ?? [];
  clearContainer(container);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx2d = canvas.getContext('2d')!;
  const { w, h, m } = plotInnerSize(spec, width, height);
  const xs = [...new Set(cells.map((c) => String(c.x)))];
  const ys = [...new Set(cells.map((c) => String(c.y)))];
  const values = cells.map((c) => Number(c.value));
  const cellW = w / Math.max(1, xs.length);
  const cellH = h / Math.max(1, ys.length);
  const maxV = max(values as number[]) ?? 1;
  const rangeColors =
    spec.colors && spec.colors.length >= 2
      ? spec.colors
      : ['#e8f4fc', '#1565c0'];
  const color = scaleLinear<string>()
    .domain([0, maxV])
    .range([rangeColors[0]!, rangeColors[rangeColors.length - 1]!])
    .interpolate(interpolateRgb);
  cells.forEach((c) => {
    const xi = xs.indexOf(String(c.x));
    const yi = ys.indexOf(String(c.y));
    ctx2d.fillStyle = color(c.value) as string;
    ctx2d.fillRect(m.left + xi * cellW, m.top + yi * cellH, cellW - 1, cellH - 1);
  });
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const xi = Math.floor((ev.clientX - rect.left - m.left) / cellW);
    const yi = Math.floor((ev.clientY - rect.top - m.top) / cellH);
    const cell = cells.find((c) => xs.indexOf(String(c.x)) === xi && ys.indexOf(String(c.y)) === yi);
    if (cell) {
      emitInteraction({ click: onClick, dblclick: onDblClick }, spec.chartType, cell, 'click');
    }
  });
  canvas.addEventListener('dblclick', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const xi = Math.floor((ev.clientX - rect.left - m.left) / cellW);
    const yi = Math.floor((ev.clientY - rect.top - m.top) / cellH);
    const cell = cells.find((c) => xs.indexOf(String(c.x)) === xi && ys.indexOf(String(c.y)) === yi);
    if (cell) {
      emitInteraction({ click: onClick, dblclick: onDblClick }, spec.chartType, cell, 'dblclick');
    }
  });
}

function renderHierarchySvg(ctx: RenderContext, sunburst: boolean): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const rootData = spec.hierarchy ?? { name: 'root', children: [] };
  clearContainer(container);
  const svg = select(container).append('svg').attr('width', width).attr('height', height);
  const { w, h, m } = plotInnerSize(spec, width, height);
  const root = hierarchy(rootData as HierarchyNode).sum((d) => hierarchyLeafValue(d));
  if (sunburst) {
    const part = partition<HierarchyNode>().size([2 * Math.PI, root.height + 1])(root);
    const radius = Math.min(w, h) / 2;
    const cx = m.left + w / 2;
    const cy = m.top + h / 2;
    const arcGen = arc<typeof part>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0 * (radius / (root.height + 1)))
      .outerRadius((d) => d.y1 * (radius / (root.height + 1)));
    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`);
    g.selectAll('path')
      .data(part.descendants().filter((d) => d.depth))
      .join('path')
      .attr('d', arcGen)
      .attr('fill', (_, i) => spec.colors?.[i % (spec.colors?.length ?? 8)] ?? '#4a90d9')
      .each(function (d) {
        attachInteractive(select(this), spec, d.data, undefined, undefined, onClick, onDblClick);
      });
  } else {
    const ui = getMoneytreeChartUiColors();
    const labelFontSize = spec.treemapLabelFontSize ?? 8;
    const showLabels = spec.treemapShowLabels !== false;
    const showCountPercent = spec.treemapShowCountPercent === true;
    const treemapTotal = root.value || 1;
    root.sort((a, b) => {
      const aLast = (a.data as HierarchyNode).treemapSortLast ? 1 : 0;
      const bLast = (b.data as HierarchyNode).treemapSortLast ? 1 : 0;
      if (aLast !== bLast) {
        return aLast - bLast;
      }
      return (b.value ?? 0) - (a.value ?? 0);
    });
    treemap<HierarchyNode>()
      .tile(treemapSquarify)
      .size([w, h])
      .padding(1)
      .round(true)(root);
    const leaves = root.leaves() as HierarchyRectangularNode<HierarchyNode>[];
    const cell = svg
      .selectAll<SVGGElement, HierarchyRectangularNode<HierarchyNode>>('g.treemap-cell')
      .data(leaves)
      .join('g')
      .attr('class', 'treemap-cell')
      .attr('transform', (d) => `translate(${m.left + d.x0},${m.top + d.y0})`);

    cell
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('fill', (d, i) => resolveTreemapCellFill(d.data as HierarchyNode, spec, i))
      .attr('fill-opacity', (d) => resolveTreemapCellFillOpacity(d.data as HierarchyNode, spec))
      .each(function (d, i) {
        attachInteractive(select(this), spec, d.data, undefined, i, onClick, onDblClick);
      });

    if (showLabels) {
      cell.each(function (d, i) {
        const cw = d.x1 - d.x0;
        const ch = d.y1 - d.y0;
        const node = d.data as HierarchyNode;
        const customLabels = node.treemapLabels;
        const adaptive = spec.treemapAdaptiveLabels === true;
        const lineCount = customLabels?.length ?? (showCountPercent ? 2 : 1);
        const minLineFs = customLabels?.length
          ? Math.min(...customLabels.map((line) => line.fontSize ?? labelFontSize))
          : labelFontSize;
        const minLabelW = adaptive ? Math.max(8, minLineFs * 1.5) : labelFontSize * 3;
        const minLabelH = adaptive
          ? Math.max(6, minLineFs + 2)
          : (customLabels?.reduce((acc, line) => acc + (line.fontSize ?? labelFontSize) + 1, 0) ??
              labelFontSize * lineCount) + 6;
        if (cw < minLabelW || ch < minLabelH) {
          return;
        }
        const g = select(this);
        const clipId = `treemap-clip-${i}-${Math.random().toString(36).slice(2, 7)}`;
        g.append('clipPath')
          .attr('id', clipId)
          .append('rect')
          .attr('width', cw)
          .attr('height', ch);
        const firstFs = customLabels?.[0]?.fontSize ?? labelFontSize;
        const text = g
          .append('text')
          .attr('clip-path', `url(#${clipId})`)
          .attr('x', 3)
          .attr('y', firstFs + 1)
          .attr('fill', ui.textPrimary)
          .attr('font-size', firstFs)
          .attr('font-weight', 500)
          .attr('pointer-events', 'none');

        if (customLabels?.length) {
          let usedH = firstFs + 1;
          customLabels.forEach((line, li) => {
            const fs = line.fontSize ?? labelFontSize;
            if (li > 0 && usedH + fs + 2 > ch) {
              return;
            }
            text
              .append('tspan')
              .attr('x', 3)
              .attr('dy', li === 0 ? 0 : fs + 1)
              .attr('fill', line.fill ?? (line.muted ? ui.textMuted : ui.textPrimary))
              .attr('font-size', fs)
              .attr('font-weight', line.fontWeight ?? 500)
              .text(truncateLabelToWidth(line.text, cw - 6, fs));
            usedH += fs + 1;
          });
          return;
        }

        const name = String(node.name ?? '');
        const count = d.value ?? 0;
        const pct = ((count / treemapTotal) * 100).toFixed(1);
        const countPct = `${new Intl.NumberFormat('en-IN').format(count)} - ${pct}%`;
        text
          .append('tspan')
          .attr('x', 3)
          .text(truncateLabelToWidth(name, cw - 6, labelFontSize));
        if (showCountPercent && ch >= labelFontSize * 2 + 4) {
          text
            .append('tspan')
            .attr('x', 3)
            .attr('dy', labelFontSize + 1)
            .attr('fill', ui.textMuted)
            .text(truncateLabelToWidth(countPct, cw - 6, labelFontSize));
        }
      });
    }
  }
}

function renderSankeySvg(ctx: RenderContext): void {
  const { container, spec, width, height } = ctx;
  clearContainer(container);
  const nodes = (spec.sankeyNodes ?? []).map((n) => ({ ...n }));
  const links = (spec.sankeyLinks ?? []).map((l) => ({ ...l }));
  const m = resolveChartMargin(spec, width, height);
  const sankeyGen = sankey().nodeWidth(15).nodePadding(10).extent([
    [m.left, m.top],
    [width - m.right, height - m.bottom],
  ]);
  const graph = sankeyGen({ nodes: nodes as never[], links: links as never[] });
  const svg = select(container).append('svg').attr('width', width).attr('height', height);
  svg
    .append('g')
    .selectAll('path')
    .data(graph.links)
    .join('path')
    .attr('d', sankeyLinkHorizontal())
    .attr('stroke', '#4a90d9')
    .attr('stroke-width', (d) => Math.max(1, (d as { width?: number }).width ?? 1))
    .attr('fill', 'none');
  svg
    .append('g')
    .selectAll('rect')
    .data(graph.nodes)
    .join('rect')
    .attr('x', (d) => (d as { x0: number }).x0)
    .attr('y', (d) => (d as { y0: number }).y0)
    .attr('width', (d) => (d as { x1: number }).x1 - (d as { x0: number }).x0)
    .attr('height', (d) => (d as { y1: number }).y1 - (d as { y0: number }).y0)
    .attr('fill', '#1976d2');
}

function renderCandlestickCanvas(ctx: RenderContext): void {
  const { container, spec, width, height } = ctx;
  const ohlc = spec.ohlc ?? [];
  clearContainer(container);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx2d = canvas.getContext('2d')!;
  const m = resolveChartMargin(spec, width, height);
  const w = width - m.left - m.right;
  const h = height - m.top - m.bottom;
  const lows = ohlc.map((d) => d.low);
  const highs = ohlc.map((d) => d.high);
  const y = scaleLinear()
    .domain([min(lows) ?? 0, max(highs) ?? 1])
    .range([m.top + h, m.top]);
  const barW = w / Math.max(1, ohlc.length);
  ohlc.forEach((d, i) => {
    const x = m.left + i * barW + barW / 2;
    ctx2d.strokeStyle = d.close >= d.open ? '#26a69a' : '#ef5350';
    ctx2d.beginPath();
    ctx2d.moveTo(x, y(d.high));
    ctx2d.lineTo(x, y(d.low));
    ctx2d.stroke();
    const top = y(Math.max(d.open, d.close));
    const bot = y(Math.min(d.open, d.close));
    ctx2d.fillStyle = d.close >= d.open ? '#26a69a' : '#ef5350';
    ctx2d.fillRect(x - barW * 0.3, top, barW * 0.6, bot - top);
  });
}

function renderPolarSvg(ctx: RenderContext): void {
  const { container, spec, width, height } = ctx;
  const categories = spec.polarCategories ?? spec.categories ?? [];
  const series = spec.series ?? [];
  clearContainer(container);
  const svg = select(container).append('svg').attr('width', width).attr('height', height);
  const { w, h, m } = plotInnerSize(spec, width, height);
  const cx = m.left + w / 2;
  const cy = m.top + h / 2;
  const radius = Math.min(w, h) / 2;
  const angle = (i: number) => (i / categories.length) * 2 * Math.PI - Math.PI / 2;
  series.forEach((s, si) => {
    const pts = asPoints(s.data);
    const maxV = max(pts, (p) => p.value) ?? 1;
    const lineGen = line<ChartPoint>()
      .x((d, i) => cx + Math.cos(angle(i)) * radius * (d.value / maxV))
      .y((d, i) => cy + Math.sin(angle(i)) * radius * (d.value / maxV));
    svg
      .append('path')
      .datum(pts)
      .attr('fill', 'none')
      .attr('stroke', spec.colors?.[si] ?? '#1976d2')
      .attr('d', lineGen);
  });
}

function renderStockListCanvas(ctx: RenderContext): void {
  const { container, spec, width, height } = ctx;
  clearContainer(container);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  const ctx2d = canvas.getContext('2d')!;
  ctx2d.fillStyle = getMoneytreeChartUiColors().textMuted;
  ctx2d.font = '12px sans-serif';
  ctx2d.fillText('Stock list — use table view for full data', 12, 24);
}

export function renderD3Chart(ctx: RenderContext, mode: 'svg' | 'canvas'): void {
  if (!ctx.animate) {
    clearContainer(ctx.container);
  }
  const type = ctx.spec.chartType;
  if (type === 'heatmap' && ctx.spec.heatmapCalendar) {
    renderCalendarHeatmapSvg(ctx);
    return;
  }
  if (type === 'scatter') {
    if (mode === 'svg') {
      renderScatterSvg(ctx);
    } else {
      renderScatterCanvas(ctx);
    }
    return;
  }

  const useCanvas =
    mode === 'canvas' ||
    type === 'heatmap' ||
    type === 'density-map' ||
    type === 'candlestick' ||
    type === 'stock-list';

  if (useCanvas) {
    if (type === 'heatmap') {
      renderHeatmapCanvas(ctx);
      return;
    }
    if (type === 'candlestick') {
      renderCandlestickCanvas(ctx);
      return;
    }
    if (type === 'stock-list') {
      renderStockListCanvas(ctx);
      return;
    }
    if (type === 'density-map') {
      renderHeatmapCanvas(ctx);
      return;
    }
  }

  switch (type) {
    case 'bar':
    case 'horizontal-bar':
    case 'stacked-horizontal-bar':
    case 'stacked-vertical-bar':
    case 'negative-bar':
    case 'waterfall':
      renderCartesianSvg(ctx);
      break;
    case 'line':
      renderLineAreaSvg(ctx, false);
      break;
    case 'area':
    case 'stacked-area':
      renderLineAreaSvg(ctx, true);
      break;
    case 'pie':
      renderPieSvg(ctx);
      break;
    case 'gauge':
      renderGaugeSvg(ctx);
      break;
    case 'treemap':
      renderHierarchySvg(ctx, false);
      break;
    case 'sunburst':
      renderHierarchySvg(ctx, true);
      break;
    case 'zoomable-sunburst':
      renderZoomableSunburstSvg(ctx);
      break;
    case 'zoomable-icicle':
      renderZoomableIcicleSvg(ctx);
      break;
    case 'sankey':
      renderSankeySvg(ctx);
      break;
    case 'polar':
      renderPolarSvg(ctx);
      break;
    case 'histogram':
      renderHistogramSvg(ctx);
      break;
    default:
      renderCartesianSvg(ctx);
  }
}

export function createD3ChartHandle(
  container: HTMLElement,
  spec: D3ChartSpec,
  mode: 'svg' | 'canvas',
  onClick?: InteractionHandler,
  onDblClick?: InteractionHandler
): D3ChartHandle {
  let currentSpec = spec;
  let clickHandler = onClick;
  let dblClickHandler = onDblClick;
  let lastW = 0;
  let lastH = 0;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  let hasRendered = false;

  const scheduleDeferredRender = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      doRender(true);
    }, 80);
  };

  const doRender = (force = false) => {
    const measured = measureChartContainer(container);
    if (!measured.ready) {
      scheduleDeferredRender();
      return;
    }
    const { width: w, height: h } = measured;
    if (!force && Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) {
      return;
    }
    const sizeChanged =
      hasRendered && (Math.abs(w - lastW) > 8 || Math.abs(h - lastH) > 8);
    const animate = hasRendered && !sizeChanged && currentSpec.animateUpdates !== false;
    lastW = w;
    lastH = h;
    try {
      renderD3Chart(
        {
          container,
          spec: currentSpec,
          width: w,
          height: h,
          onClick: clickHandler,
          onDblClick: dblClickHandler,
          animate,
        },
        mode
      );
      hasRendered = true;
    } catch (err) {
      console.error('[d3-chart] render failed', err);
      if (!animate) {
        clearContainer(container);
      }
    }
  };

  doRender(true);

  return {
    destroy() {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      hideChartTooltip();
      clearContainer(container);
    },
    resize() {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => doRender(), 80);
    },
    update(next: D3ChartSpec) {
      currentSpec = next;
      doRender(true);
    },
    getSVGElement() {
      return container.querySelector('svg');
    },
    getCanvasElement() {
      return container.querySelector('canvas');
    },
    getOption() {
      return currentSpec;
    },
    setOption(options: unknown) {
      if (options && typeof options === 'object') {
        currentSpec = { ...currentSpec, ...(options as D3ChartSpec) };
        doRender();
      }
    },
  };
}
