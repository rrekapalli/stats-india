import type { ChartMargin, D3ChartSpec } from './chart-spec.types';
import { DEFAULT_CHART_MARGIN } from './chart-spec.types';

/** Default plot inset on each side as a fraction of chart width/height (3%). */
export const DEFAULT_PLOT_MARGIN_PERCENT = 0.03;

/** Minimum inset (px) when percent margins resolve to a very small value. */
export const MIN_PLOT_MARGIN_PX = 4;

export interface ResolveChartMarginOptions {
  /** Extra top inset (px) for overlays such as breadcrumbs. */
  topExtra?: number;
  /** Minimum per-side margins (px) merged with percent and fixed floors. */
  min?: Partial<ChartMargin>;
  /** When false, ignore DEFAULT_CHART_MARGIN as a floor (spec.margin still applies). */
  useDefaultMarginFloor?: boolean;
}

export interface PlotInnerSize {
  w: number;
  h: number;
  m: ChartMargin;
}

export function resolvePlotMarginPercent(spec: D3ChartSpec): number {
  return spec.plotMarginPercent ?? DEFAULT_PLOT_MARGIN_PERCENT;
}

export function resolvePlotMarginSidePercents(spec: D3ChartSpec): ChartMargin {
  const base = resolvePlotMarginPercent(spec);
  return {
    top: spec.plotMarginPercentTop ?? spec.plotMarginPercent ?? base,
    right: spec.plotMarginPercentRight ?? spec.plotMarginPercent ?? base,
    bottom: spec.plotMarginPercentBottom ?? spec.plotMarginPercent ?? base,
    left: spec.plotMarginPercentLeft ?? spec.plotMarginPercent ?? base,
  };
}

export function resolveChartMargin(
  spec: D3ChartSpec,
  width: number,
  height: number,
  options: ResolveChartMarginOptions = {}
): ChartMargin {
  const pcts = resolvePlotMarginSidePercents(spec);
  const defaultFloor = options.useDefaultMarginFloor !== false ? DEFAULT_CHART_MARGIN : undefined;
  const floor = spec.margin ?? defaultFloor ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const minSide = {
    top: options.min?.top ?? MIN_PLOT_MARGIN_PX,
    right: options.min?.right ?? MIN_PLOT_MARGIN_PX,
    bottom: options.min?.bottom ?? MIN_PLOT_MARGIN_PX,
    left: options.min?.left ?? MIN_PLOT_MARGIN_PX,
  };
  const topExtra = options.topExtra ?? 0;

  return {
    top: Math.max(floor.top, height * pcts.top, minSide.top) + topExtra,
    right: Math.max(floor.right, width * pcts.right, minSide.right),
    bottom: Math.max(floor.bottom, height * pcts.bottom, minSide.bottom),
    left: Math.max(floor.left, width * pcts.left, minSide.left),
  };
}

export function plotInnerSize(
  spec: D3ChartSpec,
  width: number,
  height: number,
  options?: ResolveChartMarginOptions
): PlotInnerSize {
  const m = resolveChartMargin(spec, width, height, options);
  return {
    w: Math.max(10, width - m.left - m.right),
    h: Math.max(10, height - m.top - m.bottom),
    m,
  };
}
