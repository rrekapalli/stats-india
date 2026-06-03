import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { arc, interpolate, pie, type PieArcDatum, scaleOrdinal, select } from 'd3';
import { schemeTableau10 } from 'd3-scale-chromatic';
import { formatMetricPercent, formatMetricNumber } from '../../../shared/stats-metric-tooltip.util';

export interface PieChartItem {
  id: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  template: `
    <div class="pie-chart-host" #host>
      <div class="pie-chart-viewport" #viewport>
        <svg #svg></svg>
        <div class="pie-center-panel" [innerHTML]="centerPanelHtml"></div>
      </div>
    </div>
  `,
  styleUrl: './pie-chart.component.css'
})
export class PieChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() items: PieChartItem[] = [];
  @Input() unit = '';
  @Input() total = 0;
  @Input() summaryTitle = 'All categories';
  @Input() datasetTitle = '';
  @Input() datasetCategory = '';

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  centerPanelHtml = '';

  private resizeObserver: ResizeObserver | null = null;
  private pendingRenderFrame: number | null = null;
  private hoveredItem: PieChartItem | null = null;
  private readonly color = scaleOrdinal<string>(schemeTableau10);

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
    this.resizeObserver.observe(this.hostRef.nativeElement);
    this.scheduleRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.hostRef &&
      (changes['items'] || changes['total'] || changes['unit'] || changes['summaryTitle'])
    ) {
      this.scheduleRender();
      this.refreshCenterPanel();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.pendingRenderFrame !== null) {
      cancelAnimationFrame(this.pendingRenderFrame);
    }
  }

  private scheduleRender(): void {
    if (this.pendingRenderFrame !== null) {
      cancelAnimationFrame(this.pendingRenderFrame);
    }
    this.pendingRenderFrame = requestAnimationFrame(() => {
      this.pendingRenderFrame = null;
      this.render();
    });
  }

  private resolveTotal(): number {
    if (this.total > 0) {
      return this.total;
    }
    return this.items.reduce((sum, item) => sum + item.value, 0);
  }

  private refreshCenterPanel(): void {
    if (this.hoveredItem) {
      this.centerPanelHtml = this.buildSlicePanelHtml(this.hoveredItem);
    } else {
      this.centerPanelHtml = this.buildSummaryPanelHtml();
    }
    this.cdr.markForCheck();
  }

  private buildSummaryPanelHtml(): string {
    const total = this.resolveTotal();
    const sum = this.items.reduce((s, i) => s + i.value, 0);
    const sorted = [...this.items].filter(i => i.value > 0).sort((a, b) => b.value - a.value);
    const pctTotal = total || sum;
    const pctLabel = pctTotal > 0 ? formatMetricPercent(sum, pctTotal) : null;
    const lines = sorted
      .slice(0, 7)
      .map(item => this.buildCenterLineHtml(item.label, item.value, pctTotal))
      .join('');
    const footer = [this.datasetCategory, this.datasetTitle].filter(Boolean).join(' · ');

    return [
      '<div class="stats-tooltip">',
      `<div class="stats-tooltip-title">${escapeHtml(this.summaryTitle)}</div>`,
      `<div class="stats-tooltip-value">${escapeHtml(formatMetricNumber(sum))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>`,
      pctLabel ? `<div class="stats-tooltip-percent">${escapeHtml(pctLabel)} of ${escapeHtml(formatMetricNumber(pctTotal))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>` : '',
      '<div class="stats-tooltip-subtitle">Hover a slice for detail</div>',
      `<div class="pie-center-lines">${lines}</div>`,
      footer ? `<div class="stats-tooltip-footer">${escapeHtml(footer)}</div>` : '',
      '</div>'
    ].join('');
  }

  private buildSlicePanelHtml(item: PieChartItem): string {
    const total = this.resolveTotal();
    const pctLabel = total > 0 ? formatMetricPercent(item.value, total) : null;
    const footer = [this.datasetCategory, this.datasetTitle].filter(Boolean).join(' · ');

    return [
      '<div class="stats-tooltip">',
      `<div class="stats-tooltip-title">${escapeHtml(item.label)}</div>`,
      `<div class="stats-tooltip-value">${escapeHtml(formatMetricNumber(item.value))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>`,
      pctLabel ? `<div class="stats-tooltip-percent">${escapeHtml(pctLabel)} of ${escapeHtml(formatMetricNumber(total))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>` : '',
      `<div class="pie-center-lines">${this.buildCenterLineHtml(item.label, item.value, total)}</div>`,
      footer ? `<div class="stats-tooltip-footer">${escapeHtml(footer)}</div>` : '',
      '</div>'
    ].join('');
  }

  private buildCenterLineHtml(label: string, value: number, total: number): string {
    const pct = formatMetricPercent(value, total);
    return `<div class="pie-center-line">
      <span class="pie-center-swatch" style="background:${this.color(label)}"></span>
      <span class="pie-center-line-label">${escapeHtml(label)}</span>
      <span class="pie-center-line-value">${escapeHtml(formatMetricNumber(value))}${pct ? ` · ${escapeHtml(pct)}` : ''}</span>
    </div>`;
  }

  private render(): void {
    const viewport = this.viewportRef.nativeElement;
    const svgEl = this.svgRef.nativeElement;
    if (!viewport || !svgEl) {
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 80);
    const height = Math.max(Math.floor(rect.height), 80);
    if (height < 40) {
      this.scheduleRender();
      return;
    }

    const positiveItems = this.items.filter(item => item.value > 0);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 6;
    const innerRadius = radius * 0.5;

    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');

    const pieGen = pie<PieChartItem>().sort(null).value(d => d.value);
    const arcGen = arc<PieArcDatum<PieChartItem>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);
    const arcHover = arc<PieArcDatum<PieChartItem>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 5);

    const svg = select(svgEl);
    const g = svg.selectAll<SVGGElement, null>('g.pie-root').data([null]).join('g').attr('class', 'pie-root');

    g.attr('transform', `translate(${cx},${cy})`);

    type SlicePath = SVGPathElement & { _current?: PieArcDatum<PieChartItem> };

    const arcs = g
      .selectAll<SlicePath, PieArcDatum<PieChartItem>>('path.slice')
      .data(positiveItems.length ? pieGen(positiveItems) : [], d => d.data.id)
      .join(
        enter =>
          enter
            .append('path')
            .attr('class', 'slice')
            .attr('fill', d => this.color(d.data.label))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .each(function (d) {
              (this as SlicePath)._current = d;
            })
            .attr('d', d => arcGen(d) ?? ''),
        update => update,
        exit => exit.remove()
      )
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        this.hoveredItem = d.data;
        select(event.currentTarget as SlicePath)
          .transition()
          .duration(200)
          .attr('d', arcHover(d) ?? '');
        this.refreshCenterPanel();
      })
      .on('mouseleave', (event, d) => {
        this.hoveredItem = null;
        select(event.currentTarget as SlicePath)
          .transition()
          .duration(200)
          .attr('d', arcGen(d) ?? '');
        this.refreshCenterPanel();
      });

    arcs
      .transition()
      .duration(750)
      .attrTween('d', function (d) {
        const element = this as SlicePath;
        const previous = element._current ?? { startAngle: 0, endAngle: 0, data: d.data, value: 0, index: 0, padAngle: 0 };
        const interpolateFn = interpolate(previous, d);
        element._current = d;
        return (t: number) => arcGen(interpolateFn(t)) ?? '';
      })
      .attr('fill', d => this.color(d.data.label));

    if (!positiveItems.length) {
      g.selectAll('path.slice').remove();
    }

    this.refreshCenterPanel();
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
