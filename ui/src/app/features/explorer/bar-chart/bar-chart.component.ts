import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { axisBottom, axisLeft, max, scaleBand, scaleLinear, select } from 'd3';
import { buildMetricTooltipHtml, formatCompactThousands } from '../../../shared/stats-metric-tooltip.util';

export interface BarChartItem {
  id: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  template: `
    <div class="bar-chart-host" [class.bar-chart-host-horizontal]="orientation === 'horizontal'">
      <div class="bar-chart-viewport" #viewport>
        <svg #svg></svg>
      </div>
      @if (tooltipVisible) {
        <div class="map-html-tooltip"
             [innerHTML]="tooltipHtml"
             [style.left.px]="tooltipX"
             [style.top.px]="tooltipY"></div>
      }
    </div>
  `,
  styleUrl: './bar-chart.component.css'
})
export class BarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() items: BarChartItem[] = [];
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() selectedIds: readonly string[] = [];
  @Input() dimmedIds: readonly string[] = [];
  @Input() unit = '';
  @Input() total = 0;
  @Input() datasetTitle = '';
  @Input() datasetCategory = '';

  @Output() barClick = new EventEmitter<BarChartItem>();

  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  tooltipVisible = false;
  tooltipHtml = '';
  tooltipX = 0;
  tooltipY = 0;

  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(this.viewportRef.nativeElement);
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewportRef && (changes['items'] || changes['selectedIds'] || changes['dimmedIds'])) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private render(): void {
    const viewport = this.viewportRef?.nativeElement;
    const svgEl = this.svgRef?.nativeElement;
    if (!viewport || !svgEl) {
      return;
    }

    const width = Math.max(viewport.clientWidth, 120);
    const isHorizontal = this.orientation === 'horizontal';
    const rowHeight = 22;
    const chartHeight = isHorizontal
      ? Math.max(viewport.clientHeight, this.items.length * rowHeight + 48)
      : Math.max(viewport.clientHeight, 160);
    // At least ~30px for rotated x-axis labels; also honor ~5% on taller widgets.
    const verticalBottomMargin = Math.max(30, Math.round(chartHeight * 0.05));
    const margin = isHorizontal
      ? { top: 8, right: 40, bottom: 12, left: 118 }
      : { top: 8, right: 8, bottom: verticalBottomMargin, left: 36 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    svgEl.setAttribute('width', String(width));
    svgEl.setAttribute('height', String(chartHeight));

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const maxValue = max(this.items, d => d.value) ?? 0;
    const valueMax = maxValue > 0 ? maxValue : 1;
    const percentTotal = this.total > 0 ? this.total : valueMax;

    const selectedSet = new Set(this.selectedIds);
    const dimmedSet = new Set(this.dimmedIds);

    if (isHorizontal) {
      const y = scaleBand<string>()
        .domain(this.items.map(d => d.id))
        .range([0, innerHeight])
        .padding(0.18);

      const x = scaleLinear().domain([0, valueMax]).range([0, innerWidth]).nice();

      g.append('g')
        .call(axisLeft(y).tickFormat(id => this.items.find(d => d.id === id)?.label ?? id))
        .selectAll('text')
        .attr('font-size', '10px');

      const bars = g
        .selectAll<SVGRectElement, BarChartItem>('rect.bar')
        .data(this.items, d => d.id)
        .join('rect')
        .attr('class', 'bar')
        .attr('y', d => y(d.id) ?? 0)
        .attr('x', 0)
        .attr('height', y.bandwidth())
        .attr('width', d => x(d.value))
        .attr('fill', d => this.barFill(d, selectedSet, dimmedSet))
        .attr('rx', 1)
        .style('cursor', 'pointer');

      const bindInteractions = (
        selection: ReturnType<typeof g.selectAll<SVGRectElement, BarChartItem>>
      ): void => {
        selection
          .on('mouseenter', (event: MouseEvent, d: BarChartItem) => {
            this.showTooltip(event, d, percentTotal);
          })
          .on('mousemove', (event: MouseEvent, d: BarChartItem) => {
            this.showTooltip(event, d, percentTotal);
          })
          .on('mouseleave', () => {
            this.tooltipVisible = false;
            this.cdr.markForCheck();
          })
          .on('click', (_event: MouseEvent, d: BarChartItem) => {
            this.barClick.emit(d);
          });
      };

      bindInteractions(bars);

      g.selectAll<SVGTextElement, BarChartItem>('text.bar-value-label')
        .data(this.items, d => d.id)
        .join('text')
        .attr('class', 'bar-value-label')
        .attr('x', d => x(d.value) + 4)
        .attr('y', d => (y(d.id) ?? 0) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('font-size', '9px')
        .attr('fill', d => (d.value <= 0 ? '#94a3b8' : '#64748b'))
        .text(d => formatCompactThousands(d.value))
        .style('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent, d: BarChartItem) => {
          this.showTooltip(event, d, percentTotal);
        })
        .on('mousemove', (event: MouseEvent, d: BarChartItem) => {
          this.showTooltip(event, d, percentTotal);
        })
        .on('mouseleave', () => {
          this.tooltipVisible = false;
          this.cdr.markForCheck();
        })
        .on('click', (_event: MouseEvent, d: BarChartItem) => {
          this.barClick.emit(d);
        });
    } else {
      const x = scaleBand<string>()
        .domain(this.items.map(d => d.id))
        .range([0, innerWidth])
        .padding(0.22);

      const y = scaleLinear().domain([0, valueMax]).range([innerHeight, 0]).nice();

      g.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(axisBottom(x).tickSizeOuter(0).tickPadding(4).tickFormat(id => {
          const label = this.items.find(d => d.id === id)?.label ?? id;
          return label.length > 12 ? `${label.slice(0, 11)}…` : label;
        }))
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.3em')
        .attr('dy', '0.35em')
        .attr('font-size', '9px')
        .attr('fill', '#475569');

      const bars = g
        .selectAll<SVGRectElement, BarChartItem>('rect.bar')
        .data(this.items, d => d.id)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.id) ?? 0)
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.value))
        .attr('height', d => innerHeight - y(d.value))
        .attr('fill', d => this.barFill(d, selectedSet, dimmedSet))
        .attr('rx', 1)
        .style('cursor', 'pointer');

      const bindInteractions = (
        selection: ReturnType<typeof g.selectAll<SVGRectElement, BarChartItem>>
      ): void => {
        selection
          .on('mouseenter', (event: MouseEvent, d: BarChartItem) => {
            this.showTooltip(event, d, percentTotal);
          })
          .on('mousemove', (event: MouseEvent, d: BarChartItem) => {
            this.showTooltip(event, d, percentTotal);
          })
          .on('mouseleave', () => {
            this.tooltipVisible = false;
            this.cdr.markForCheck();
          })
          .on('click', (_event: MouseEvent, d: BarChartItem) => {
            this.barClick.emit(d);
          });
      };

      bindInteractions(bars);
    }
  }

  private barFill(
    item: BarChartItem,
    selected: Set<string>,
    dimmed: Set<string>
  ): string {
    if (selected.has(item.id)) {
      return '#0d47a1';
    }
    if (dimmed.has(item.id) || (selected.size > 0 && !selected.has(item.id))) {
      return '#cbd5e1';
    }
    if (item.value <= 0) {
      return '#e2e8f0';
    }
    return '#1565c0';
  }

  private showTooltip(event: MouseEvent, item: BarChartItem, percentTotal: number): void {
    const host = this.viewportRef.nativeElement.getBoundingClientRect();
    this.tooltipX = event.clientX - host.left + 10;
    this.tooltipY = event.clientY - host.top + 10;
    this.tooltipHtml = buildMetricTooltipHtml({
      title: item.label,
      value: item.value,
      total: percentTotal,
      unit: this.unit,
      subtitle: item.value <= 0 ? 'No records in current dataset' : undefined,
      datasetTitle: this.datasetTitle,
      category: this.datasetCategory
    });
    this.tooltipVisible = true;
    this.cdr.markForCheck();
  }
}
