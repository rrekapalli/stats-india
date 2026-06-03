import { select, type Selection } from 'd3-selection';
import { transition, type Transition } from 'd3-transition';
import { easeCubicOut } from 'd3-ease';

export const CHART_TRANSITION_MS = 480;
export const CHART_ENTER_MS = 520;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ChartTransition = Transition<any, any, any, any>;

export function chartTransition(animate: boolean, durationMs = CHART_TRANSITION_MS): ChartTransition | null {
  if (!animate) {
    return null;
  }
  return transition().duration(durationMs).ease(easeCubicOut);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transitionSelection(sel: Selection<any, any, any, any>, t: ChartTransition | null): any {
  if (!t || sel.empty()) {
    return sel;
  }
  return sel.transition(t);
}

const MIN_CHART_PX = 24;

/** Prefer layout box size; defer render until the host has non-zero dimensions. */
export function measureChartContainer(container: HTMLElement): {
  width: number;
  height: number;
  ready: boolean;
} {
  const rect = container.getBoundingClientRect();
  const width = Math.max(container.clientWidth, rect.width, 0);
  const height = Math.max(container.clientHeight, rect.height, 0);
  const ready = width >= MIN_CHART_PX && height >= MIN_CHART_PX;
  return { width: Math.round(width), height: Math.round(height), ready };
}

export function clearContainer(container: HTMLElement): void {
  container.innerHTML = '';
}

export function ensureChartSvg(
  container: HTMLElement,
  width: number,
  height: number,
  reset: boolean
): Selection<SVGSVGElement, unknown, null, undefined> {
  const root = select(container);
  if (reset) {
    clearContainer(container);
  }
  let svg = root.select<SVGSVGElement>('svg.mt-d3-chart');
  if (svg.empty()) {
    svg = root
      .append('svg')
      .attr('class', 'mt-d3-chart')
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .style('pointer-events', 'auto')
      .style('overflow', 'visible');
  } else {
    svg.attr('width', width).attr('height', height);
  }
  return svg;
}
