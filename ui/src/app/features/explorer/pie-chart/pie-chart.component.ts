import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
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
        <div class="pie-chart-canvas" #canvas>
          <svg #svg></svg>
        </div>
        <div class="pie-info-panel" [innerHTML]="infoPanelHtml"></div>
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

  @Output() sliceClick = new EventEmitter<PieChartItem>();

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLDivElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  infoPanelHtml = '';

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
    }
    if (changes['items'] || changes['total'] || changes['unit'] || changes['datasetTitle'] || changes['datasetCategory']) {
      this.refreshInfoPanel();
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

  private refreshInfoPanel(): void {
    if (this.hoveredItem) {
      this.infoPanelHtml = this.buildSlicePanelHtml(this.hoveredItem);
    } else {
      this.infoPanelHtml = this.buildSummaryPanelHtml();
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
      .map(item => this.buildInfoLineHtml(item.label, item.value, pctTotal))
      .join('');

    return [
      '<div class="stats-tooltip">',
      `<div class="stats-tooltip-title">${escapeHtml(this.summaryTitle)}</div>`,
      `<div class="stats-tooltip-value">${escapeHtml(formatMetricNumber(sum))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>`,
      pctLabel ? `<div class="stats-tooltip-percent">${escapeHtml(pctLabel)} of ${escapeHtml(formatMetricNumber(pctTotal))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>` : '',
      '<div class="stats-tooltip-subtitle">Hover a slice for detail</div>',
      `<div class="pie-info-lines">${lines}</div>`,
      '</div>'
    ].join('');
  }

  private buildSlicePanelHtml(item: PieChartItem): string {
    const total = this.resolveTotal();
    const pctLabel = total > 0 ? formatMetricPercent(item.value, total) : null;

    return [
      '<div class="stats-tooltip">',
      `<div class="stats-tooltip-title">${escapeHtml(item.label)}</div>`,
      `<div class="stats-tooltip-value">${escapeHtml(formatMetricNumber(item.value))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>`,
      pctLabel ? `<div class="stats-tooltip-percent">${escapeHtml(pctLabel)} of ${escapeHtml(formatMetricNumber(total))}${this.unit ? ` ${escapeHtml(this.unit)}` : ''}</div>` : '',
      `<div class="pie-info-lines">${this.buildInfoLineHtml(item.label, item.value, total)}</div>`,
      '</div>'
    ].join('');
  }

  private buildInfoLineHtml(label: string, value: number, total: number): string {
    const pct = formatMetricPercent(value, total);
    return `<div class="pie-info-line">
      <span class="pie-info-swatch" style="background:${this.color(label)}"></span>
      <span class="pie-info-line-label">${escapeHtml(label)}</span>
      <span class="pie-info-line-value">${escapeHtml(formatMetricNumber(value))}${pct ? ` · ${escapeHtml(pct)}` : ''}</span>
    </div>`;
  }

  private render(): void {
    const canvas = this.canvasRef?.nativeElement;
    const svgEl = this.svgRef?.nativeElement;
    if (!canvas || !svgEl) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 60);
    const height = Math.max(Math.floor(rect.height), 60);
    if (height < 40 || width < 40) {
      this.scheduleRender();
      return;
    }

    const positiveItems = this.items.filter(item => item.value > 0);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 6;
    const innerRadius = radius * 0.38;

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
        this.refreshInfoPanel();
      })
      .on('mouseleave', (event, d) => {
        this.hoveredItem = null;
        select(event.currentTarget as SlicePath)
          .transition()
          .duration(200)
          .attr('d', arcGen(d) ?? '');
        this.refreshInfoPanel();
      })
      .on('click', (_event, d) => {
        this.sliceClick.emit(d.data);
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

    this.refreshInfoPanel();
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
