import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IWidget } from '../../entities/IWidget';
import { D3ChartComponent } from '../d3-chart/d3-chart.component';
import type { D3ChartSpec } from '../../chart-spec';

@Component({
  selector: 'app-peer-metrics-bar',
  standalone: true,
  imports: [CommonModule, D3ChartComponent],
  templateUrl: './peer-metrics-bar.component.html',
  styleUrls: ['./peer-metrics-bar.component.scss'],
})
export class PeerMetricsBarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() widget?: IWidget;

  ngOnInit(): void {
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.widget?.chartInstance) {
      try {
        this.widget.chartInstance.destroy();
      } catch {
        /* ignore */
      }
      this.widget.chartInstance = null;
    }
  }

  get isLoading(): boolean {
    return (this.widget?.data as { isLoading?: boolean })?.isLoading ?? false;
  }

  get metricNames(): string[] {
    return (this.widget?.data as { metricNames?: string[] })?.metricNames ?? [];
  }

  get selectedMetricName(): string {
    return (this.widget?.data as { selectedMetricName?: string })?.selectedMetricName ?? '';
  }

  get chartWidget(): IWidget | null {
    const spec = this.chartSpec;
    if (!spec || !this.widget) {
      return null;
    }
    return {
      ...this.widget,
      config: {
        ...this.widget.config,
        component: 'd3chart',
        options: spec,
      },
    };
  }

  get chartSpec(): D3ChartSpec | null {
    const raw = (this.widget?.data as { d3ChartSpec?: D3ChartSpec })?.d3ChartSpec;
    if (raw?.chartType) {
      return raw;
    }
    const legacy = (this.widget?.data as { chartOptions?: { xAxis?: { data?: string[] }; series?: { data?: unknown[] }[] } })
      ?.chartOptions;
    const categories = legacy?.xAxis?.data ?? [];
    const seriesData = legacy?.series?.[0]?.data;
    if (!categories.length && !seriesData?.length) {
      return null;
    }
    return {
      chartType: 'bar',
      categories,
      series: [{ name: 'Peers', data: seriesData ?? [] }],
      horizontal: true,
    };
  }

  get hasChart(): boolean {
    return !!this.chartSpec;
  }

  get emptyMessage(): string {
    return (this.widget?.data as { emptyMessage?: string })?.emptyMessage ?? 'No peer metrics';
  }

  get peerAvgLegend(): string {
    const s = (this.widget?.data as { peerAvgLegend?: string })?.peerAvgLegend;
    return typeof s === 'string' && s.trim() ? s.trim() : '';
  }

  onMetricChange(metric: string): void {
    const fn = (this.widget?.data as { onMetricChange?: (m: string) => void })?.onMetricChange;
    fn?.(metric);
  }

  onChartDblClick(event: { datum?: { symbol?: string } }): void {
    const sym = event?.datum && typeof event.datum === 'object' ? (event.datum as { symbol?: string }).symbol : undefined;
    if (sym) {
      void this.router.navigate(['/stock-insights', sym, 'overview']);
    }
  }
}
