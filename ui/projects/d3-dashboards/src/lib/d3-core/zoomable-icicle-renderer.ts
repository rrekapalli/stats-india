import { select, type Selection } from 'd3-selection';
import { hierarchy, partition, type HierarchyRectangularNode } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';
import type { D3ChartSpec, HierarchyNode } from '../chart-spec';
import { plotInnerSize, hierarchyLeafValue } from '../chart-spec';
import { getMoneytreeChartUiColors } from './theme';
import { emitInteraction, type InteractionHandler } from './interaction';
import { clearContainer } from './chart-transitions';
import { hideChartTooltip, moveChartTooltip, resolveTooltipHtml, showChartTooltip } from './chart-html-tooltip';

const FOCUS_PATH_ATTR = 'data-zoomable-icicle-focus-path';
const TRANSITION_MS = 750;
const BREADCRUMB_RESERVE_PX = 20;
/** Fixed width (px) for the root column in the initial icicle view. */
const ROOT_COL_PX = 10;
const MIN_LABEL_HEIGHT_PX = 14;
const MIN_LABEL_WIDTH_PX = 28;

interface IcicleLayoutNode {
  data: HierarchyNode;
  depth: number;
  height: number;
  value?: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  parent: IcicleLayoutNode | null;
  children?: IcicleLayoutNode[];
  current: { x0: number; x1: number; y0: number; y1: number };
  target?: { x0: number; x1: number; y0: number; y1: number };
}

function focusPathKey(node: IcicleLayoutNode): string {
  const names: string[] = [];
  let cur: IcicleLayoutNode | null = node;
  while (cur) {
    names.unshift(cur.data.name);
    cur = cur.parent;
  }
  return names.join('\0');
}

function findLayoutNodeByPath(
  root: HierarchyRectangularNode<HierarchyNode>,
  pathKey: string | null
): IcicleLayoutNode | null {
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
  return layoutNode as unknown as IcicleLayoutNode;
}

function rectHeight(d: { x0: number; x1: number }): number {
  return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
}

function cellWidth(d: { y0: number; y1: number }): number {
  return Math.max(0, d.y1 - d.y0 - 1);
}

function cellVisible(
  d: { y0: number; y1: number; x0: number; x1: number },
  visibleWidth: number,
  plotH: number
): boolean {
  return d.y1 <= visibleWidth && d.y0 >= 0 && d.x1 > d.x0 && d.x0 < plotH && d.x1 > 0;
}

function labelFontSizeForCell(cellH: number): number {
  return Math.max(7, Math.min(10, cellH * 0.42));
}

function truncateLabel(text: string, cellW: number, fontSize: number): string {
  const approxCharWidth = fontSize * 0.58;
  const maxChars = Math.floor((cellW - 6) / approxCharWidth);
  if (maxChars < 6) {
    return '';
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars - 1)}…`;
}

function labelVisible(
  d: { y0: number; y1: number; x0: number; x1: number },
  node: IcicleLayoutNode,
  visibleWidth: number,
  plotH: number,
  labelText: string,
  fontSize: number
): boolean {
  if (node.depth <= 0 || !labelText) {
    return false;
  }
  const cellH = d.x1 - d.x0;
  const cellW = cellWidth(d);
  if (!cellVisible(d, visibleWidth, plotH)) {
    return false;
  }
  if (cellH < MIN_LABEL_HEIGHT_PX || cellW < MIN_LABEL_WIDTH_PX) {
    return false;
  }
  if (cellH < fontSize + 3) {
    return false;
  }
  return truncateLabel(labelText, cellW, fontSize).length > 0;
}

function sectorColorNode(d: IcicleLayoutNode): IcicleLayoutNode {
  let node: IcicleLayoutNode = d;
  while (node.depth > 1 && node.parent) {
    node = node.parent;
  }
  return node;
}

function formatCount(v: number): string {
  return new Intl.NumberFormat('en-IN').format(v);
}

function cellLabelText(node: IcicleLayoutNode, totalValue: number): string {
  const val = node.value ?? 0;
  const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
  return `${node.data.name} - ${formatCount(val)} (${pct}%)`;
}

function breadcrumbLabel(node: IcicleLayoutNode, totalValue: number): string {
  if (node.depth === 0) {
    return '';
  }
  const parts: string[] = [];
  let cur: IcicleLayoutNode | null = node;
  while (cur && cur.depth > 0) {
    parts.unshift(cellLabelText(cur, totalValue));
    cur = cur.parent;
  }
  return parts.join(' -> ');
}

function remapPartitionColumns(n: IcicleLayoutNode, plotW: number, depthColumns: number): void {
  const dataColWidth = (plotW - ROOT_COL_PX) / depthColumns;
  if (n.depth === 0) {
    n.y0 = 0;
    n.y1 = ROOT_COL_PX;
    return;
  }
  n.y0 = ROOT_COL_PX + (n.depth - 1) * dataColWidth;
  n.y1 = ROOT_COL_PX + n.depth * dataColWidth;
}

export function renderZoomableIcicleSvg(ctx: {
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

  const svg = select(container)
    .append('svg')
    .attr('class', 'mt-d3-chart')
    .attr('width', width)
    .attr('height', height)
    .attr('role', 'img')
    .style('overflow', 'hidden');

  const breadcrumb = svg
    .append('text')
    .attr('class', 'icicle-breadcrumb')
    .attr('x', m.left)
    .attr('y', m.top + 11)
    .attr('fill', ui.textPrimary)
    .attr('font-size', 10)
    .attr('font-weight', 600);

  const root = hierarchy(rootData as HierarchyNode)
    .sum((d) => hierarchyLeafValue(d))
    .sort((a, b) => b.height - a.height || (b.value ?? 0) - (a.value ?? 0));

  partition<HierarchyNode>().size([h, w])(root);

  const depthColumns = Math.max(1, root.height);
  root.each((d) => {
    const n = d as unknown as IcicleLayoutNode;
    remapPartitionColumns(n, w, depthColumns);
    n.current = { x0: n.x0, x1: n.x1, y0: n.y0, y1: n.y1 };
  });

  const totalValue = root.value ?? 0;
  const layoutRoot = root as unknown as IcicleLayoutNode;
  const visibleWidth = w;
  const clipUid = `icicle-clip-${Math.random().toString(36).slice(2, 9)}`;

  const colorScale = scaleOrdinal<string>().range(colors);
  const colorFor = (d: IcicleLayoutNode) =>
    d.depth === 0 ? ui.chartSurfaceMuted : (d.data.color ?? colorScale(sectorColorNode(d).data.name));

  const descendants = root.descendants().map((d) => d as unknown as IcicleLayoutNode);

  const g = svg.append('g').attr('class', 'icicle-plot').attr('transform', `translate(${m.left},${m.top})`);

  const cell = g
    .append('g')
    .attr('class', 'icicle-cells')
    .selectAll('g')
    .data(descendants)
    .join('g')
    .attr('class', 'icicle-cell')
    .attr('transform', (d) => `translate(${d.current.y0},${d.current.x0})`);

  cell.each(function (d, i) {
    const sel = select(this);
    const c = d.current;
    sel
      .append('clipPath')
      .attr('id', `${clipUid}-${i}`)
      .append('rect')
      .attr('class', 'icicle-cell-clip')
      .attr('width', cellWidth(c))
      .attr('height', Math.max(0, rectHeight(c)));
  });

  const rect = cell
    .append('rect')
    .attr('width', (d) => cellWidth(d.current))
    .attr('height', (d) => Math.max(0, rectHeight(d.current)))
    .attr('fill', (d) => colorFor(d))
    .attr('fill-opacity', (d) =>
      d.depth > 0 && cellVisible(d.current, visibleWidth, h) ? (d.children ? 0.72 : 0.88) : d.depth === 0 ? 0.35 : 0
    )
    .attr('stroke', ui.border)
    .attr('stroke-width', 0.5)
    .style('cursor', (d) => (d.depth > 0 && cellVisible(d.current, visibleWidth, h) ? 'pointer' : 'default'))
    .style('pointer-events', (d) => (d.depth > 0 && cellVisible(d.current, visibleWidth, h) ? 'all' : 'none'));

  const text = cell
    .append('text')
    .attr('pointer-events', 'none')
    .attr('clip-path', (_, i) => `url(#${clipUid}-${i})`)
    .attr('x', 3)
    .attr('fill', ui.textPrimary)
    .each(function (d) {
      const c = d.current;
      const fullLabel = cellLabelText(d, totalValue);
      const fontSize = labelFontSizeForCell(c.x1 - c.x0);
      const show = labelVisible(c, d, visibleWidth, h, fullLabel, fontSize);
      const label = show ? truncateLabel(fullLabel, cellWidth(c), fontSize) : '';
      select(this)
        .attr('y', fontSize + 1)
        .attr('font-size', fontSize)
        .attr('fill-opacity', show ? 1 : 0)
        .text(label);
    });

  const syncCellGraphics = (d: IcicleLayoutNode, c: { x0: number; x1: number; y0: number; y1: number }) => {
    const fullLabel = cellLabelText(d, totalValue);
    const fontSize = labelFontSizeForCell(c.x1 - c.x0);
    const show = labelVisible(c, d, visibleWidth, h, fullLabel, fontSize);
    const wCell = cellWidth(c);
    const hCell = Math.max(0, rectHeight(c));
    return {
      transform: `translate(${c.y0},${c.x0})`,
      width: wCell,
      height: hCell,
      visible: d.depth > 0 && cellVisible(c, visibleWidth, h),
      showLabel: show,
      label: show ? truncateLabel(fullLabel, wCell, fontSize) : '',
      fontSize,
      labelY: fontSize + 1,
    };
  };

  const attachTooltip = (el: Selection<SVGRectElement, IcicleLayoutNode, SVGGElement, unknown>) => {
    el
      .on('mouseenter', function (event: MouseEvent, d) {
        if (d.depth <= 0) {
          return;
        }
        const tipHtml =
          resolveTooltipHtml(spec, { ...d.data, value: d.value ?? d.data.value }) ??
          cellLabelText(d, totalValue);
        showChartTooltip(tipHtml, event);
      })
      .on('mousemove', (event: MouseEvent) => moveChartTooltip(event))
      .on('mouseleave', () => hideChartTooltip());
  };

  attachTooltip(rect as Selection<SVGRectElement, IcicleLayoutNode, SVGGElement, unknown>);

  let focusNode: IcicleLayoutNode = layoutRoot;

  const updateBreadcrumb = (node: IcicleLayoutNode) => {
    breadcrumb.text(breadcrumbLabel(node, totalValue));
  };

  const applyFocus = (nextFocus: IcicleLayoutNode, animate: boolean) => {
    focusNode = nextFocus;
    if (nextFocus.depth === 0) {
      container.removeAttribute(FOCUS_PATH_ATTR);
    } else {
      container.setAttribute(FOCUS_PATH_ATTR, focusPathKey(nextFocus));
    }
    updateBreadcrumb(nextFocus);

    const fx0 = nextFocus.x0;
    const fx1 = nextFocus.x1;
    const fy0 = nextFocus.y0;
    const spanX = fx1 - fx0 || 1;

    root.each((d) => {
      const n = d as unknown as IcicleLayoutNode;
      n.target = {
        x0: ((n.x0 - fx0) / spanX) * h,
        x1: ((n.x1 - fx0) / spanX) * h,
        y0: n.y0 - fy0,
        y1: n.y1 - fy0,
      };
      if (!animate) {
        n.current = { ...n.target };
      }
    });

    if (animate) {
      const t = cell.transition().duration(TRANSITION_MS);
      cell.transition(t).attr('transform', (d) => `translate(${d.target!.y0},${d.target!.x0})`);
      rect
        .transition(t)
        .attr('width', (d) => cellWidth(d.target!))
        .attr('height', (d) => Math.max(0, rectHeight(d.target!)))
        .attr('fill-opacity', (d) =>
          d.depth > 0 && cellVisible(d.target!, visibleWidth, h) ? (d.children ? 0.72 : 0.88) : 0
        )
        .style('pointer-events', (d) =>
          d.depth > 0 && cellVisible(d.target!, visibleWidth, h) ? 'all' : 'none'
        );
      cell
        .select('clipPath rect')
        .transition(t)
        .attr('width', (d) => cellWidth(d.target!))
        .attr('height', (d) => Math.max(0, rectHeight(d.target!)));
      text
        .transition(t)
        .attr('y', (d) => {
          const fontSize = labelFontSizeForCell(d.target!.x1 - d.target!.x0);
          return fontSize + 1;
        })
        .attr('font-size', (d) => labelFontSizeForCell(d.target!.x1 - d.target!.x0))
        .attr('fill-opacity', (d) => {
          const fullLabel = cellLabelText(d, totalValue);
          const fontSize = labelFontSizeForCell(d.target!.x1 - d.target!.x0);
          return +labelVisible(d.target!, d, visibleWidth, h, fullLabel, fontSize);
        })
        .text((d) => {
          const fullLabel = cellLabelText(d, totalValue);
          const fontSize = labelFontSizeForCell(d.target!.x1 - d.target!.x0);
          return labelVisible(d.target!, d, visibleWidth, h, fullLabel, fontSize)
            ? truncateLabel(fullLabel, cellWidth(d.target!), fontSize)
            : '';
        });
      t.on('end', () => {
        root.each((d) => {
          const n = d as unknown as IcicleLayoutNode;
          if (n.target) {
            n.current = { ...n.target };
          }
        });
      });
    } else {
      cell.attr('transform', (d) => `translate(${d.current.y0},${d.current.x0})`);
      rect
        .attr('width', (d) => cellWidth(d.current))
        .attr('height', (d) => Math.max(0, rectHeight(d.current)))
        .attr('fill-opacity', (d) =>
          d.depth > 0 && cellVisible(d.current, visibleWidth, h) ? (d.children ? 0.72 : 0.88) : 0
        )
        .style('pointer-events', (d) =>
          d.depth > 0 && cellVisible(d.current, visibleWidth, h) ? 'all' : 'none'
        );
      cell
        .select('clipPath rect')
        .attr('width', (d) => cellWidth(d.current))
        .attr('height', (d) => Math.max(0, rectHeight(d.current)));
      text
        .attr('y', (d) => syncCellGraphics(d, d.current).labelY)
        .attr('font-size', (d) => syncCellGraphics(d, d.current).fontSize)
        .attr('fill-opacity', (d) => +(syncCellGraphics(d, d.current).showLabel ? 1 : 0))
        .text((d) => syncCellGraphics(d, d.current).label);
    }
  };

  const onCellClick = (event: MouseEvent, p: IcicleLayoutNode) => {
    event.stopPropagation();
    hideChartTooltip();
    if (p.depth <= 0) {
      return;
    }

    emitInteraction(
      { click: onClick, dblclick: onDblClick },
      spec.chartType,
      { ...p.data, value: p.value ?? p.data.value },
      'click'
    );

    if (!p.children?.length) {
      return;
    }

    const nextFocus = focusNode === p ? (p.parent ?? layoutRoot) : p;
    applyFocus(nextFocus, true);
  };

  rect.on('click', onCellClick);

  rect.on('dblclick', (event: MouseEvent, p: IcicleLayoutNode) => {
    event.stopPropagation();
    if (p.depth <= 0) {
      return;
    }
    emitInteraction(
      { click: onClick, dblclick: onDblClick },
      spec.chartType,
      { ...p.data, value: p.value ?? p.data.value },
      'dblclick'
    );
  });

  const initialFocus = findLayoutNodeByPath(root as HierarchyRectangularNode<HierarchyNode>, savedFocus);
  if (initialFocus && initialFocus.depth > 0 && initialFocus.children?.length) {
    applyFocus(initialFocus, false);
  } else {
    updateBreadcrumb(layoutRoot);
  }
}
