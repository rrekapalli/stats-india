import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { select, zoom, zoomIdentity, scaleSequential, interpolateBlues } from 'd3';
import indiaMap from '@svg-maps/india';
import { StateMetric } from '../../../models/dataset.models';

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
    <div class="map-shell">
      <div class="map-toolbar">
        <span class="map-title">{{ title }}</span>
        <div class="map-actions">
          <button type="button" class="map-btn" (click)="resetZoom()" title="Reset zoom">
            ↺
          </button>
        </div>
      </div>
      <div class="map-viewport" #viewport>
        <svg #svg [attr.viewBox]="viewBox" preserveAspectRatio="xMidYMid meet" role="img"
             aria-label="Zoomable India state map">
          <g #zoomLayer></g>
        </svg>
      </div>
      <div class="map-legend">
        <span>{{ legendMin | number:'1.0-1' }}</span>
        <div class="legend-bar"></div>
        <span>{{ legendMax | number:'1.0-1' }}</span>
        <span class="legend-unit">{{ unit }}</span>
      </div>
    </div>
  `,
  styleUrl: './india-state-map.component.css'
})
export class IndiaStateMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() metrics: StateMetric[] = [];
  @Input() title = 'India — state view';
  @Input() unit = '';

  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('zoomLayer', { static: true }) zoomLayerRef!: ElementRef<SVGGElement>;

  readonly viewBox = indiaMap.viewBox;
  legendMin = 0;
  legendMax = 100;

  private zoomBehavior: ReturnType<typeof zoom<SVGSVGElement, unknown>> | null = null;
  private selectedState: string | null = null;

  ngAfterViewInit(): void {
    this.renderMap();
    this.setupZoom();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['metrics'] && this.zoomLayerRef) {
      this.renderMap();
    }
  }

  ngOnDestroy(): void {
    select(this.svgRef.nativeElement).on('.zoom', null);
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

  private setupZoom(): void {
    this.zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        select(this.zoomLayerRef.nativeElement).attr('transform', event.transform.toString());
      });

    select(this.svgRef.nativeElement).call(this.zoomBehavior);
  }

  private renderMap(): void {
    const valueByState = new Map(this.metrics.map(m => [this.normalizeName(m.state), m.value]));
    const values = this.metrics.map(m => m.value);
    this.legendMin = values.length ? Math.min(...values) : 0;
    this.legendMax = values.length ? Math.max(...values) : 100;

    const color = scaleSequential(interpolateBlues)
      .domain([this.legendMin, this.legendMax || 1]);

    const layer = select(this.zoomLayerRef.nativeElement);
    layer.selectAll('*').remove();

    const locations = (indiaMap as { locations: MapLocation[] }).locations;

    const paths = layer.selectAll<SVGPathElement, MapLocation>('path.state-path')
      .data(locations, d => d.id)
      .join('path')
      .attr('class', d => 'state-path' + (this.selectedState === d.name ? ' selected' : ''))
      .attr('d', d => d.path)
      .attr('fill', d => {
        const value = valueByState.get(this.normalizeName(d.name));
        return value == null ? '#e2e8f0' : color(value);
      })
      .style('cursor', 'pointer');

    paths.selectAll('title').remove();
    paths.append('title').text(d => {
      const value = valueByState.get(this.normalizeName(d.name));
      return value == null
        ? `${d.name}: no data`
        : `${d.name}: ${value} ${this.unit}`.trim();
    });

    paths.on('click', (_event, d) => {
      this.selectedState = this.selectedState === d.name ? null : d.name;
      this.renderMap();
    });
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }
}
