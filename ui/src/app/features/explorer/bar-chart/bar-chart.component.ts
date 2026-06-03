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
    <div class="bar-chart-host"
         #host
         [class.bar-chart-host-horizontal]="orientation === 'horizontal'"
         [class.bar-chart-host-vertical]="orientation === 'vertical'">
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

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  tooltipVisible = false;
  tooltipHtml = '';
  tooltipX = 0;
  tooltipY = 0;

  private resizeObserver: ResizeObserver | null = null;
  private pendingRenderFrame: number | null = null;

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
    this.resizeObserver.observe(this.hostRef.nativeElement);
    this.scheduleRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hostRef && (changes['items'] || changes['selectedIds'] || changes['dimmedIds'] || changes['orientation'])) {
      this.scheduleRender();
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

  private measureHostSize(): { width: number; height: number } {
    const host = this.hostRef.nativeElement;
    const rect = host.getBoundingClientRect();
    return {
      width: Math.max(Math.floor(rect.width), 120),
      height: Math.max(Math.floor(rect.height), 80)
    };
  }

  private render(): void {
    const viewport = this.viewportRef?.nativeElement;
    const svgEl = this.svgRef?.nativeElement;
    const host = this.hostRef?.nativeElement;
    if (!viewport || !svgEl || !host) {
      return;
    }

    const isHorizontal = this.orientation === 'horizontal';
    const hostSize = this.measureHostSize();

    if (!isHorizontal && hostSize.height < 40) {
      this.scheduleRender();
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const viewportWidth = Math.max(Math.floor(viewportRect.width), 120);
    const viewportHeight = Math.max(Math.floor(viewportRect.height), 80);
    const chartWidth = isHorizontal ? hostSize.width : viewportWidth;
    const rowHeight = 22;
    const chartHeight = isHorizontal
      ? Math.max(hostSize.height, this.items.length * rowHeight + 48)
      : viewportHeight;
    const verticalBottomMargin = 28;
    const margin = isHorizontal
      ? { top: 8, right: 40, bottom: 12, left: 118 }
      : { top: 6, right: 6, bottom: verticalBottomMargin, left: 32 };

    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    if (isHorizontal) {
      svgEl.setAttribute('width', String(chartWidth));
      svgEl.setAttribute('height', String(chartHeight));
      svgEl.removeAttribute('viewBox');
      svgEl.removeAttribute('preserveAspectRatio');
    } else {
      svgEl.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);
      svgEl.setAttribute('preserveAspectRatio', 'none');
      svgEl.setAttribute('width', '100%');
      svgEl.setAttribute('height', '100%');
    }

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
        }));

      g.select('.axis-x')
        .selectAll('text')
        .attr('text-anchor', 'end')
        .attr('dx', '-0.3em')
        .attr('dy', '0.35em')
        .attr('font-size', '9px')
        .attr('fill', '#475569')
        .attr('transform', (_d, i, nodes) => {
          const el = nodes[i] as SVGTextElement;
          const xPos = el.getAttribute('x') ?? '0';
          return `translate(${xPos}, 0) rotate(-35)`;
        });

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
