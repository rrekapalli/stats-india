import { CommonModule } from '@angular/common';
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
import {
  axisBottom,
  axisLeft,
  format,
  line as d3Line,
  max,
  min,
  pointer,
  scaleLinear,
  scaleOrdinal,
  select
} from 'd3';
import { StateTimeSeries } from '../../../models/dataset.models';
import { formatCompactThousands, formatMetricPercent } from '../../../shared/stats-metric-tooltip.util';
import { statePaletteColor } from '../geography-widget/state-color.util';

interface SeriesPoint {
  year: number;
  value: number;
}

interface SeriesRow {
  state: string;
  stateCode: string;
  points: SeriesPoint[];
}

interface HoverSeriesEntry {
  state: string;
  displayLabel: string;
  valueLabel: string;
  percentLabel: string;
  color: string;
}

@Component({
  selector: 'app-state-multi-line-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './state-multi-line-chart.component.html',
  styleUrl: './state-multi-line-chart.component.css'
})
export class StateMultiLineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() series: StateTimeSeries | null = null;
  @Input() selectedState: string | null = null;
  @Input() dimUnselected = false;

  @Output() stateClick = new EventEmitter<string>();

  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  hoverYear: number | null = null;
  hoverEntry: HoverSeriesEntry | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private pendingFrame: number | null = null;
  private hoveredState: string | null = null;
  private unit = '';

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(() => this.scheduleRender());
    this.resizeObserver.observe(this.hostRef.nativeElement);
    this.scheduleRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hostRef && (
      changes['series'] ||
      changes['selectedState'] ||
      changes['dimUnselected']
    )) {
      this.scheduleRender();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.pendingFrame !== null) {
      cancelAnimationFrame(this.pendingFrame);
    }
  }

  private scheduleRender(): void {
    if (this.pendingFrame !== null) {
      cancelAnimationFrame(this.pendingFrame);
    }
    this.pendingFrame = requestAnimationFrame(() => {
      this.pendingFrame = null;
      this.render();
    });
  }

  private render(): void {
    const svgEl = this.svgRef?.nativeElement;
    const host = this.hostRef?.nativeElement;
    if (!svgEl || !host || !this.series?.years?.length || !this.series.lines?.length) {
      select(svgEl).selectAll('*').remove();
      this.clearHover();
      return;
    }

    const years = this.series.years;
    const lines = this.series.lines;
    this.unit = this.series.unit ?? '';

    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width), 160);
    const height = Math.max(Math.floor(rect.height), 120);
    const margin = {
      top: Math.round(height * 0.08),
      right: Math.round(width * 0.1),
      bottom: Math.max(28, Math.round(height * 0.12)),
      left: Math.round(width * 0.05)
    };
    const innerWidth = Math.max(width - margin.left - margin.right, 80);
    const innerHeight = Math.max(height - margin.top - margin.bottom, 60);

    svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const allValues = lines.flatMap(l => l.values);
    const yMin = min(allValues) ?? 0;
    const yMax = max(allValues) ?? 1;

    const x = scaleLinear()
      .domain([years[0], years[years.length - 1]])
      .range([0, innerWidth]);

    const y = scaleLinear()
      .domain([Math.min(0, yMin), yMax > 0 ? yMax : 1])
      .nice()
      .range([innerHeight, 0]);

    const color = scaleOrdinal<string>()
      .domain(lines.map(l => l.state))
      .range(lines.map(l => statePaletteColor(l.state)));

    const lineGen = d3Line<SeriesPoint>()
      .x(d => x(d.year))
      .y(d => y(d.value));

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axisBottom(x).ticks(Math.min(years.length, 8)).tickFormat(d => format('d')(d as number)))
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#64748b');

    g.append('g')
      .attr('class', 'axis axis-y')
      .call(axisLeft(y).ticks(5).tickFormat(d => formatCompactThousands(Number(d))))
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#64748b');

    g.selectAll('.grid-y line')
      .data(y.ticks(5))
      .join('line')
      .attr('class', 'grid-y')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 0.5);

    const seriesData: SeriesRow[] = lines.map(line => ({
      state: line.state,
      stateCode: line.stateCode,
      points: years.map((year, index) => ({
        year,
        value: line.values[index] ?? 0
      }))
    }));

    const paths = g
      .selectAll<SVGPathElement, SeriesRow>('path.line')
      .data(seriesData, d => d.state)
      .join('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('d', d => lineGen(d.points) ?? '')
      .attr('stroke', d => color(d.state) ?? '#64748b')
      .attr('stroke-width', d => this.strokeWidth(d.state))
      .attr('opacity', d => this.lineOpacity(d.state))
      .style('pointer-events', 'none');

    const endLabels = g
      .selectAll<SVGTextElement, SeriesRow>('text.line-end-label')
      .data(seriesData, d => d.state)
      .join('text')
      .attr('class', 'line-end-label')
      .attr('x', d => {
        const last = d.points[d.points.length - 1];
        return x(last.year) + 3;
      })
      .attr('y', d => {
        const last = d.points[d.points.length - 1];
        return y(last.value);
      })
      .attr('dy', '0.32em')
      .attr('text-anchor', 'start')
      .attr('font-size', '7px')
      .attr('fill', d => color(d.state) ?? '#64748b')
      .attr('opacity', d => this.labelOpacity(d.state))
      .attr('pointer-events', 'none')
      .text(d => this.endLabelText(d));

    const focus = g.append('g').attr('class', 'focus').style('opacity', 0);

    const focusLine = focus
      .append('line')
      .attr('class', 'focus-line')
      .attr('y1', 0)
      .attr('y2', innerHeight);

    const focusDots = focus
      .selectAll<SVGCircleElement, SeriesRow>('circle.focus-dot')
      .data(seriesData, d => d.state)
      .join('circle')
      .attr('class', 'focus-dot')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    const refreshStyles = (): void => {
      paths
        .attr('stroke-width', d => this.strokeWidth(d.state))
        .attr('opacity', d => this.lineOpacity(d.state));
      endLabels
        .attr('opacity', d => this.labelOpacity(d.state))
        .attr('font-weight', d => (this.hoveredState === d.state || this.selectedState === d.state ? 600 : 400));
    };

    const nearestYear = (mx: number): number => {
      const year = Math.round(x.invert(mx));
      return years.reduce((best, candidate) =>
        Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best, years[0]);
    };

    const showAtYear = (mx: number, my: number): void => {
      const clampedYear = nearestYear(mx);
      const yearIndex = years.indexOf(clampedYear);
      if (yearIndex < 0) {
        return;
      }

      const xPos = x(clampedYear);
      let nearestRow: SeriesRow | null = null;
      let nearestValue = 0;
      let nearestDistance = Infinity;
      let yearTotal = 0;

      for (const entry of seriesData) {
        if (!this.isLineVisible(entry.state)) {
          continue;
        }
        const value = entry.points[yearIndex]?.value ?? 0;
        yearTotal += value;
        const cy = y(value);
        const distance = Math.abs(my - cy) + Math.abs(mx - xPos) * 0.01;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestRow = entry;
          nearestValue = value;
        }
      }

      if (!nearestRow) {
        return;
      }

      const nearestState = nearestRow.state;
      this.hoveredState = nearestState;
      this.hoverYear = clampedYear;
      this.hoverEntry = {
        state: nearestState,
        displayLabel: nearestRow.state,
        valueLabel: `${formatCompactThousands(nearestValue)}${this.unit ? ` ${this.unit}` : ''}`,
        percentLabel: formatMetricPercent(nearestValue, yearTotal) ?? '0%',
        color: color(nearestState) ?? '#64748b'
      };
      this.cdr.markForCheck();

      focus.style('opacity', 1);
      focusLine.attr('x1', xPos).attr('x2', xPos);
      focusDots
        .attr('cx', xPos)
        .attr('cy', d => y(d.points[yearIndex]?.value ?? 0))
        .attr('fill', d => color(d.state) ?? '#64748b')
        .attr('r', d => (d.state === nearestState ? 4 : 0))
        .attr('opacity', d => (d.state === nearestState ? 1 : 0));

      refreshStyles();
    };

    const hideFocus = (): void => {
      focus.style('opacity', 0);
      this.hoveredState = null;
      this.clearHover();
      refreshStyles();
    };

    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay
      .on('mousemove', (event: MouseEvent) => {
        const [mx, my] = pointer(event, overlay.node() as Element);
        showAtYear(mx, my);
      })
      .on('mouseleave', () => {
        hideFocus();
      })
      .on('click', () => {
        if (this.hoveredState) {
          this.stateClick.emit(this.hoveredState);
        }
      });
  }

  private endLabelText(row: SeriesRow): string {
    if (row.stateCode?.trim()) {
      return row.stateCode.trim();
    }
    const name = row.state.trim();
    return name.length > 14 ? `${name.slice(0, 13)}…` : name;
  }

  private strokeWidth(state: string): number {
    if (this.selectedState === state) {
      return 2.4;
    }
    if (this.hoveredState === state) {
      return 2;
    }
    return 1.2;
  }

  private lineOpacity(state: string): number {
    if (!this.isLineVisible(state)) {
      return 0.12;
    }
    if (this.hoveredState && this.hoveredState !== state) {
      return 0.25;
    }
    if (this.selectedState && this.selectedState !== state) {
      return 0.35;
    }
    return 0.9;
  }

  private labelOpacity(state: string): number {
    if (!this.isLineVisible(state)) {
      return 0.15;
    }
    if (this.hoveredState && this.hoveredState !== state) {
      return 0.35;
    }
    if (this.selectedState && this.selectedState !== state) {
      return 0.45;
    }
    return 0.95;
  }

  private isLineVisible(state: string): boolean {
    if (!this.dimUnselected || !this.selectedState) {
      return true;
    }
    return this.selectedState === state;
  }

  private clearHover(): void {
    this.hoverYear = null;
    this.hoverEntry = null;
    this.cdr.markForCheck();
  }
}
