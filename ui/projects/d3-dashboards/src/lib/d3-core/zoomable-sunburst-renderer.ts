import { select, type Selection } from 'd3-selection';
import { arc } from 'd3-shape';
import { hierarchy, partition, type HierarchyRectangularNode } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';
import { interpolate } from 'd3-interpolate';
import type { D3ChartSpec, HierarchyNode } from '../chart-spec';
import { plotInnerSize, hierarchyLeafValue } from '../chart-spec';
import { getMoneytreeChartUiColors } from './theme';
import { emitInteraction, type InteractionHandler } from './interaction';
import { clearContainer } from './chart-transitions';
import { hideChartTooltip, moveChartTooltip, resolveTooltipHtml, showChartTooltip } from './chart-html-tooltip';

const FOCUS_PATH_ATTR = 'data-zoomable-sunburst-focus-path';
const TRANSITION_MS = 750;
const BREADCRUMB_RESERVE_PX = 20;
/** Center hole as a fraction of plot radius — smaller hole gives rings more radial space for labels. */
const DEFAULT_SUNBURST_INNER_RADIUS_RATIO = 0.1;

interface SunburstLayoutNode {
  data: HierarchyNode;
  depth: number;
  height: number;
  value?: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  parent: SunburstLayoutNode | null;
  children?: SunburstLayoutNode[];
  current: { x0: number; x1: number; y0: number; y1: number };
  target?: { x0: number; x1: number; y0: number; y1: number };
}

function focusPathKey(node: SunburstLayoutNode): string {
  const names: string[] = [];
  let cur: SunburstLayoutNode | null = node;
  while (cur) {
    names.unshift(cur.data.name);
    cur = cur.parent;
  }
  return names.join('\0');
}

function findLayoutNodeByPath(
  root: HierarchyRectangularNode<HierarchyNode>,
  pathKey: string | null
): SunburstLayoutNode | null {
  if (!pathKey) {
    return null;
  }
  const names = pathKey.split('\0').slice(1);
  if (!names.length) {
    return null;
  }
  let layoutNode: HierarchyRectangularNode<HierarchyNode> = root;
  for (const name of names) {
    const child = layoutNode.children?.find((c) => c.data.name === name);
    if (!child) {
      return null;
    }
    layoutNode = child;
  }
  return layoutNode as unknown as SunburstLayoutNode;
}

function arcVisible(d: { y0: number; y1: number; x0: number; x1: number }): boolean {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d: { y0: number; y1: number; x0: number; x1: number }): boolean {
  return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function sectorColorNode(d: SunburstLayoutNode): SunburstLayoutNode {
  let node: SunburstLayoutNode = d;
  while (node.depth > 1 && node.parent) {
    node = node.parent;
  }
  return node;
}

function formatCount(v: number): string {
  return new Intl.NumberFormat('en-IN').format(v);
}

function breadcrumbLabel(node: SunburstLayoutNode, totalValue: number): string {
  if (node.depth === 0) {
    return '';
  }
  const parts: string[] = [];
  let cur: SunburstLayoutNode | null = node;
  while (cur && cur.depth > 0) {
    const val = cur.value ?? 0;
    const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
    parts.unshift(`${cur.data.name} - ${formatCount(val)} (${pct}%)`);
    cur = cur.parent;
  }
  return parts.join(' -> ');
}

export function renderZoomableSunburstSvg(ctx: {
  container: HTMLElement;
  spec: D3ChartSpec;
  width: number;
  height: number;
  onClick?: InteractionHandler;
  onDblClick?: InteractionHandler;
}): void {
  const { container, spec, width, height, onClick, onDblClick } = ctx;
  const ui = getMoneytreeChartUiColors();
  const rootData = spec.hierarchy ?? { name: 'root', children: [] };
  const colors = spec.colors ?? ['#4a90d9', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
  const savedFocus = container.getAttribute(FOCUS_PATH_ATTR);

  clearContainer(container);

  const { w, h, m } = plotInnerSize(spec, width, height, { topExtra: BREADCRUMB_RESERVE_PX });
  const plotRadius = Math.min(w, h) / 2;
  const cx = m.left + w / 2;
  const cy = m.top + h / 2;

  const svg = select(container)
    .append('svg')
    .attr('class', 'mt-d3-chart')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img')
    .style('overflow', 'hidden');

  const breadcrumb = svg
    .append('text')
    .attr('class', 'sunburst-breadcrumb')
    .attr('x', m.left)
    .attr('y', m.top + 11)
    .attr('fill', ui.textPrimary)
    .attr('font-size', 10)
    .attr('font-weight', 600);

  const root = hierarchy(rootData as HierarchyNode)
    .sum((d) => hierarchyLeafValue(d))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  partition<HierarchyNode>().size([2 * Math.PI, root.height + 1])(root);

  const dataRingCount = Math.max(1, root.height);
  const innerHole = plotRadius * (spec.sunburstInnerRadiusRatio ?? DEFAULT_SUNBURST_INNER_RADIUS_RATIO);
  const ringBand = (plotRadius - innerHole) / dataRingCount;
  const radiusForY = (y: number) => innerHole + Math.max(0, y - 1) * ringBand;
  const totalValue = root.value ?? 0;
  const layoutRoot = root as unknown as SunburstLayoutNode;

  root.each((d) => {
    const n = d as unknown as SunburstLayoutNode;
    n.current = { x0: n.x0, x1: n.x1, y0: n.y0, y1: n.y1 };
  });

  const colorScale = scaleOrdinal<string>().range(colors);
  const colorFor = (d: SunburstLayoutNode) =>
    d.data.color ?? colorScale(sectorColorNode(d).data.name);

  const arcGen = arc<{ x0: number; x1: number; y0: number; y1: number }>()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(ringBand * 0.5)
    .innerRadius((d) => radiusForY(d.y0))
    .outerRadius((d) => Math.max(radiusForY(d.y0), radiusForY(d.y1) - 1));

  const labelTransform = (d: { x0: number; x1: number; y0: number; y1: number }) => {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = radiusForY((d.y0 + d.y1) / 2);
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  };

  const descendants = root.descendants().filter((d) => d.depth).map((d) => d as unknown as SunburstLayoutNode);

  const g = svg.append('g').attr('class', 'sunburst-plot').attr('transform', `translate(${cx},${cy})`);

  const path = g
    .append('g')
    .attr('class', 'sunburst-arcs')
    .selectAll('path')
    .data(descendants)
    .join('path')
    .attr('fill', (d) => colorFor(d))
    .attr('fill-opacity', (d) => (d.children ? 0.72 : 0.88))
    .attr('stroke', ui.border)
    .attr('stroke-width', 0.5)
    .attr('pointer-events', (d) => (arcVisible(d.current) ? 'auto' : 'none'))
    .attr('d', (d) => arcGen(d.current)!);

  const labelFontSize = Math.max(7, Math.min(10, ringBand * 0.22));
  const label = g
    .append('g')
    .attr('class', 'sunburst-labels')
    .attr('pointer-events', 'none')
    .attr('text-anchor', 'middle')
    .selectAll('text')
    .data(descendants)
    .join('text')
    .attr('fill', ui.textPrimary)
    .attr('font-size', labelFontSize)
    .attr('fill-opacity', (d) => +labelVisible(d.current))
    .attr('transform', (d) => labelTransform(d.current))
    .text((d) => (labelVisible(d.current) ? d.data.name : ''));

  const attachTooltip = (el: Selection<SVGPathElement, SunburstLayoutNode, SVGGElement, unknown>) => {
    el.style('cursor', 'pointer').style('pointer-events', 'all');
    el
      .on('mouseenter', function (event: MouseEvent, d) {
        const tipHtml = resolveTooltipHtml(spec, { ...d.data, value: d.value ?? d.data.value });
        if (tipHtml) {
          showChartTooltip(tipHtml, event);
        }
      })
      .on('mousemove', (event: MouseEvent) => moveChartTooltip(event))
      .on('mouseleave', () => hideChartTooltip());
  };

  attachTooltip(path as Selection<SVGPathElement, SunburstLayoutNode, SVGGElement, unknown>);

  let focusNode: SunburstLayoutNode = layoutRoot;

  const centerHit = g
    .append('circle')
    .attr('class', 'sunburst-center-hit')
    .attr('r', innerHole)
    .attr('fill', 'transparent')
    .attr('stroke', 'none')
    .style('pointer-events', 'none');

  const updateCenterHit = (focus: SunburstLayoutNode) => {
    focusNode = focus;
    const zoomed = focus.depth > 0;
    const hitRadius = zoomed ? ringBand : innerHole;
    centerHit
      .attr('r', hitRadius)
      .style('cursor', zoomed ? 'pointer' : 'default')
      .style('pointer-events', zoomed ? 'all' : 'none')
      .attr('stroke', zoomed ? ui.border : 'none')
      .attr('stroke-width', zoomed ? 0.75 : 0)
      .attr('fill', zoomed ? ui.chartSurfaceMuted : 'transparent')
      .attr('fill-opacity', zoomed ? 0.35 : 0);
  };

  const updateBreadcrumb = (node: SunburstLayoutNode) => {
    breadcrumb.text(breadcrumbLabel(node, totalValue));
  };

  const applyFocus = (nextFocus: SunburstLayoutNode, animate: boolean) => {
    updateCenterHit(nextFocus);
    if (nextFocus.depth === 0) {
      container.removeAttribute(FOCUS_PATH_ATTR);
    } else {
      container.setAttribute(FOCUS_PATH_ATTR, focusPathKey(nextFocus));
    }
    updateBreadcrumb(nextFocus);

    root.each((d) => {
      const n = d as unknown as SunburstLayoutNode;
      n.target = {
        x0: Math.max(0, Math.min(1, (n.x0 - nextFocus.x0) / (nextFocus.x1 - nextFocus.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (n.x1 - nextFocus.x0) / (nextFocus.x1 - nextFocus.x0))) * 2 * Math.PI,
        y0: Math.max(0, n.y0 - nextFocus.depth),
        y1: Math.max(0, n.y1 - nextFocus.depth),
      };
      if (!animate) {
        n.current = { ...n.target };
      }
    });

    if (animate) {
      path
        .transition()
        .duration(TRANSITION_MS)
        .tween('data', function (d: SunburstLayoutNode) {
          const i = interpolate(d.current, d.target!);
          return (t) => {
            d.current = i(t);
          };
        })
        .attr('fill-opacity', (d) => (arcVisible(d.target!) ? (d.children ? 0.72 : 0.88) : 0))
        .attr('pointer-events', (d) => (arcVisible(d.target!) ? 'auto' : 'none'))
        .attrTween('d', (d) => () => arcGen(d.current)!);

      label
        .transition()
        .duration(TRANSITION_MS)
        .attr('fill-opacity', (d) => +labelVisible(d.target!))
        .attrTween('transform', (d) => () => labelTransform(d.current))
        .text((d) => (labelVisible(d.target!) ? d.data.name : ''));
    } else {
      path
        .attr('fill-opacity', (d) => (arcVisible(d.current) ? (d.children ? 0.72 : 0.88) : 0))
        .attr('pointer-events', (d) => (arcVisible(d.current) ? 'auto' : 'none'))
        .attr('d', (d) => arcGen(d.current)!);
      label
        .attr('fill-opacity', (d) => +labelVisible(d.current))
        .attr('transform', (d) => labelTransform(d.current))
        .text((d) => (labelVisible(d.current) ? d.data.name : ''));
    }
  };

  path.on('click', (event: MouseEvent, p: SunburstLayoutNode) => {
    event.stopPropagation();
    applyFocus(p, true);
    emitInteraction(
      { click: onClick, dblclick: onDblClick },
      spec.chartType,
      { ...p.data, value: p.value ?? p.data.value },
      'click'
    );
  });

  path.on('dblclick', (event: MouseEvent, p: SunburstLayoutNode) => {
    event.stopPropagation();
    emitInteraction(
      { click: onClick, dblclick: onDblClick },
      spec.chartType,
      { ...p.data, value: p.value ?? p.data.value },
      'dblclick'
    );
  });

  centerHit.on('click', (event: MouseEvent) => {
    event.stopPropagation();
    hideChartTooltip();
    if (focusNode.depth <= 0) {
      return;
    }
    const parent = focusNode.parent ?? layoutRoot;
    applyFocus(parent, true);
    emitInteraction(
      { click: onClick, dblclick: onDblClick },
      spec.chartType,
      { ...parent.data, value: parent.value ?? parent.data.value },
      'click'
    );
  });

  const initialFocus = findLayoutNodeByPath(
    root as HierarchyRectangularNode<HierarchyNode>,
    savedFocus
  );
  if (initialFocus && initialFocus.depth > 0) {
    applyFocus(initialFocus, false);
  } else {
    updateCenterHit(layoutRoot);
    updateBreadcrumb(layoutRoot);
  }
}
