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
import { DecimalPipe } from '@angular/common';
import { select, zoom, zoomIdentity, scaleSequential, interpolateBlues } from 'd3';
import indiaMap from '@svg-maps/india';
import { StateMetric } from '../../../models/dataset.models';
import { buildMetricTooltipHtml } from '../../../shared/stats-metric-tooltip.util';
import { statePaletteColor } from '../geography-widget/state-color.util';

interface MapLocation {
  name: string;
  id: string;
  path: string;
}

@Component({
  selector: 'app-india-state-map',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <div class="map-shell" [class.map-shell-embedded]="embedded">
      @if (!embedded) {
        <div class="map-toolbar">
          <span class="map-title">{{ title }}</span>
          <div class="map-actions">
            <button type="button" class="map-btn" (click)="resetZoom()" title="Reset zoom">
              ↺
            </button>
          </div>
        </div>
      }
      <div class="map-viewport" #viewport>
        @if (!hideInfoPanel) {
          <div
            class="map-info-panel"
            [class.map-info-panel-compact]="compactInfoPanel"
            [innerHTML]="infoPanelHtml"></div>
        }
        <div class="map-legend map-legend-overlay" aria-hidden="true">
          <span class="legend-bound">{{ legendMin | number:'1.0-0' }}</span>
          <div class="legend-bar"></div>
          <span class="legend-bound">{{ legendMax | number:'1.0-0' }}</span>
          @if (unit) {
            <span class="legend-unit">{{ unit }}</span>
          }
        </div>
        <svg #svg [attr.viewBox]="svgViewBox" [attr.preserveAspectRatio]="svgPreserveAspectRatio" role="img"
             aria-label="Zoomable India state map">
          <g #zoomLayer></g>
        </svg>
      </div>
    </div>
  `,
  styleUrl: './india-state-map.component.css'
})
export class IndiaStateMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() metrics: StateMetric[] = [];
  @Input() title = 'India — state view';
  @Input() unit = '';
  @Input() embedded = false;
  @Input() totalForPercent = 0;
  @Input() datasetTitle = '';
  @Input() datasetCategory = '';
  @Input() selectedState: string | null = null;
  @Input() dimUnselected = false;
  @Input() hideInfoPanel = false;
  @Input() compactInfoPanel = false;

  @Output() stateClick = new EventEmitter<string>();

  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('zoomLayer', { static: true }) zoomLayerRef!: ElementRef<SVGGElement>;
  @ViewChild('viewport', { static: true }) viewportRef!: ElementRef<HTMLDivElement>;

  readonly standaloneViewBox = buildMapViewBoxWithMargins(indiaMap.viewBox as string, {
    left: 0.05,
    right: 0.15,
    top: 0.05,
    bottom: 0.05
  });

  readonly embeddedViewBox = buildMapViewBoxWithMargins(indiaMap.viewBox as string, {
    left: 0.05,
    right: 0.05,
    top: 0.05,
    bottom: 0.05
  });

  get svgViewBox(): string {
    return this.embedded ? this.embeddedViewBox : this.standaloneViewBox;
  }

  get svgPreserveAspectRatio(): string {
    return this.embedded ? 'xMidYMid meet' : 'xMinYMid meet';
  }

  legendMin = 0;
  legendMax = 100;

  infoPanelHtml = '';

  private zoomBehavior: ReturnType<typeof zoom<SVGSVGElement, unknown>> | null = null;
  private mapHoveredLocation: MapLocation | null = null;
  private listHoveredState: string | null = null;
  private choroplethScale: ReturnType<typeof scaleSequential<string>> | null = null;
  private valueByStateCache = new Map<string, StateMetric>();

  /** Preview a state from an external control (e.g. ranking list hover). */
  showStatePreview(stateName: string): void {
    this.listHoveredState = stateName;
    this.syncHoverPresentation();
  }

  /** Clear external preview; map hover or national summary resumes. */
  clearStatePreview(): void {
    this.listHoveredState = null;
    this.syncHoverPresentation();
  }

  resetZoom(): void {
    if (!this.zoomBehavior) {
      return;
    }
    select(this.svgRef.nativeElement)
      .transition()
      .duration(250)
      .call(this.zoomBehavior.transform, zoomIdentity);
  }

  ngAfterViewInit(): void {
    this.renderMap();
    this.setupZoom();
    if (!this.hideInfoPanel) {
      this.refreshInfoPanel();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.zoomLayerRef && (changes['metrics'] || changes['totalForPercent'] || changes['selectedState'] || changes['dimUnselected'])) {
      this.renderMap();
    }
    if (changes['metrics'] || changes['totalForPercent'] || changes['datasetTitle'] || changes['datasetCategory'] || changes['unit']) {
      if (!this.hideInfoPanel) {
        this.refreshInfoPanel();
      }
    }
  }

  ngOnDestroy(): void {
    select(this.svgRef.nativeElement).on('.zoom', null);
  }

  private setupZoom(): void {
    this.zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        select(this.zoomLayerRef.nativeElement).attr('transform', event.transform.toString());
      });

    select(this.svgRef.nativeElement).call(this.zoomBehavior);
  }

  private renderMap(): void {
    const valueByState = new Map(this.metrics.map(m => [this.normalizeName(m.state), m]));
    const values = this.metrics.map(m => m.value);
    this.legendMin = values.length ? Math.min(...values) : 0;
    this.legendMax = values.length ? Math.max(...values) : 100;

    const total = this.totalForPercent > 0
      ? this.totalForPercent
      : values.reduce((sum, v) => sum + v, 0);

    const color = scaleSequential(interpolateBlues)
      .domain([this.legendMin, this.legendMax || 1]);
    this.choroplethScale = color;
    this.valueByStateCache = valueByState;

    const layer = select(this.zoomLayerRef.nativeElement);
    layer.selectAll('*').remove();

    const locations = (indiaMap as { locations: MapLocation[] }).locations;

    const paths = layer.selectAll<SVGPathElement, MapLocation>('path.state-path')
      .data(locations, d => d.id)
      .join('path')
      .attr('class', d => {
        const classes = ['state-path'];
        if (this.selectedState === d.name) {
          classes.push('selected');
        }
        if (this.isHoveredState(d.name)) {
          classes.push('hovered');
        }
        if (this.isDimmed(d.name, valueByState)) {
          classes.push('dimmed');
        }
        return classes.join(' ');
      })
      .attr('d', d => d.path)
      .attr('fill', d => this.resolvePathFill(d.name, valueByState, color))
      .attr('stroke', d => this.resolvePathStroke(d.name))
      .attr('stroke-width', d => this.resolvePathStrokeWidth(d.name))
      .attr('stroke-linejoin', 'round')
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('opacity', d => (this.isDimmed(d.name, valueByState) ? 0.35 : 1))
      .style('cursor', 'pointer');

    paths
      .on('mouseenter', (_event: MouseEvent, d) => {
        this.mapHoveredLocation = d;
        this.syncHoverPresentation();
      })
      .on('mouseleave', () => {
        this.mapHoveredLocation = null;
        this.syncHoverPresentation();
      });

    paths.on('click', (_event, d) => {
      this.stateClick.emit(d.name);
    });

    this.updateHoverStyles();
  }

  private resolvePathFill(
    stateName: string,
    valueByState: Map<string, StateMetric>,
    choropleth: ReturnType<typeof scaleSequential<string>>
  ): string {
    if (this.listHoveredState === stateName) {
      return statePaletteColor(stateName);
    }
    if (this.isDimmed(stateName, valueByState)) {
      return '#e2e8f0';
    }
    const metric = valueByState.get(this.normalizeName(stateName));
    if (metric == null) {
      return '#f1f5f9';
    }
    if (metric.value <= 0) {
      return '#eef2ff';
    }
    return choropleth(metric.value);
  }

  private resolvePathStroke(stateName: string): string {
    if (this.listHoveredState === stateName) {
      return '#0f172a';
    }
    if (this.selectedState === stateName) {
      return '#0f172a';
    }
    if (this.isMapHoveredState(stateName)) {
      return '#334155';
    }
    return '#64748b';
  }

  private resolvePathStrokeWidth(stateName: string): number {
    if (this.listHoveredState === stateName || this.selectedState === stateName) {
      return 1.4;
    }
    if (this.isMapHoveredState(stateName)) {
      return 1.1;
    }
    return 0.85;
  }

  private isMapHoveredState(stateName: string): boolean {
    return !this.listHoveredState && this.mapHoveredLocation?.name === stateName;
  }

  private isHoveredState(stateName: string): boolean {
    const active = this.activeHoveredStateName();
    return active != null && active === stateName;
  }

  private activeHoveredStateName(): string | null {
    if (this.listHoveredState) {
      return this.listHoveredState;
    }
    return this.mapHoveredLocation?.name ?? null;
  }

  private activeHoveredLocation(): MapLocation | null {
    if (this.listHoveredState) {
      const locations = (indiaMap as { locations: MapLocation[] }).locations;
      return locations.find(l => this.normalizeName(l.name) === this.normalizeName(this.listHoveredState!)) ?? null;
    }
    return this.mapHoveredLocation;
  }

  private syncHoverPresentation(): void {
    this.updateHoverStyles();
    if (!this.hideInfoPanel) {
      this.refreshInfoPanel();
    }
  }

  private updateHoverStyles(): void {
    if (!this.zoomLayerRef || !this.choroplethScale) {
      return;
    }
    const choropleth = this.choroplethScale;
    const valueByState = this.valueByStateCache;
    const listHighlight = this.listHoveredState;
    const highlight = this.activeHoveredStateName();

    select(this.zoomLayerRef.nativeElement)
      .selectAll<SVGPathElement, MapLocation>('path.state-path')
      .classed('hovered', d => highlight != null && d.name === highlight && !listHighlight)
      .classed('hovered-from-list', d => listHighlight != null && d.name === listHighlight)
      .attr('fill', d => this.resolvePathFill(d.name, valueByState, choropleth))
      .attr('stroke', d => this.resolvePathStroke(d.name))
      .attr('stroke-width', d => this.resolvePathStrokeWidth(d.name));
  }

  private isDimmed(
    stateName: string,
    valueByState: Map<string, StateMetric>
  ): boolean {
    if (!this.dimUnselected) {
      return false;
    }
    if (this.selectedState && this.selectedState === stateName) {
      return false;
    }
    return !this.selectedState || this.selectedState !== stateName;
  }

  private refreshInfoPanel(): void {
    const location = this.activeHoveredLocation();
    if (location) {
      const valueByState = new Map(this.metrics.map(m => [this.normalizeName(m.state), m]));
      const total = this.resolveTotal();
      this.updateInfoPanel(
        location,
        valueByState.get(this.normalizeName(location.name)),
        total
      );
      return;
    }
    this.infoPanelHtml = this.buildNationSummaryHtml(this.resolveTotal());
    this.cdr.markForCheck();
  }

  private resolveTotal(): number {
    const values = this.metrics.map(m => m.value);
    if (this.totalForPercent > 0) {
      return this.totalForPercent;
    }
    return values.reduce((sum, v) => sum + v, 0);
  }

  private buildNationSummaryHtml(total: number): string {
    const nationalTotal = this.metrics.reduce((sum, m) => sum + m.value, 0);
    const statesWithData = this.metrics.filter(m => m.value > 0).length;
    const top = [...this.metrics].sort((a, b) => b.value - a.value)[0];
    const rows: { label: string; value: string }[] = [
      { label: 'States / UTs', value: String(this.metrics.length) },
      { label: 'With data', value: String(statesWithData) }
    ];
    if (top) {
      rows.push({ label: 'Top state', value: `${top.state} (${top.value.toLocaleString()})` });
    }
    return buildMetricTooltipHtml({
      title: 'India (national)',
      value: nationalTotal,
      total,
      unit: this.unit,
      subtitle: 'Hover a state for regional detail',
      datasetTitle: this.datasetTitle,
      category: this.datasetCategory,
      rows
    });
  }

  private updateInfoPanel(
    location: MapLocation,
    metric: StateMetric | undefined,
    total: number
  ): void {
    if (!metric) {
      this.infoPanelHtml = buildMetricTooltipHtml({
        title: location.name,
        value: 'No data',
        subtitle: 'Not present in this dataset sample',
        datasetTitle: this.datasetTitle,
        category: this.datasetCategory
      });
    } else {
      this.infoPanelHtml = buildMetricTooltipHtml({
        title: metric.state,
        value: metric.value,
        total,
        unit: metric.unit || this.unit,
        subtitle: metric.stateCode ? `State code: ${metric.stateCode}` : undefined,
        datasetTitle: this.datasetTitle,
        category: this.datasetCategory,
        rows: metric.year ? [{ label: 'Period', value: metric.year }] : []
      });
    }
    this.cdr.markForCheck();
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }
}

function buildMapViewBoxWithMargins(
  raw: string,
  margins: { left?: number; right?: number; top?: number; bottom?: number }
): string {
  const parts = raw.trim().split(/\s+/).map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n))) {
    return raw;
  }
  const [x, y, width, height] = parts;
  const leftPad = width * (margins.left ?? 0);
  const rightPad = width * (margins.right ?? 0);
  const topPad = height * (margins.top ?? 0);
  const bottomPad = height * (margins.bottom ?? 0);
  return `${x - leftPad} ${y - topPad} ${width + leftPad + rightPad} ${height + topPad + bottomPad}`;
}
