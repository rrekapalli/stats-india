import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  Inject,
  DOCUMENT,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IWidget } from '../../entities/IWidget';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-peer-metrics-bar',
  standalone: true,
  imports: [CommonModule, NgxEchartsDirective],
  templateUrl: './peer-metrics-bar.component.html',
  styleUrls: ['./peer-metrics-bar.component.scss'],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts'),
    }),
  ],
})
export class PeerMetricsBarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() widget?: IWidget;

  echartsTheme: 'moneytree-light' | 'moneytree-dark' = 'moneytree-light';
  readonly chartBackgroundMerge: EChartsOption = { backgroundColor: 'transparent' };

  private htmlClassObserver: MutationObserver | null = null;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnInit(): void {
    this.syncEchartsThemeFromDocument();
    const el = this.document.documentElement;
    this.htmlClassObserver = new MutationObserver(() => {
      this.syncEchartsThemeFromDocument();
      this.cdr.markForCheck();
    });
    this.htmlClassObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  ngOnDestroy(): void {
    this.htmlClassObserver?.disconnect();
    this.htmlClassObserver = null;
    if (this.widget?.chartInstance) {
      try {
        this.widget.chartInstance.dispose();
      } catch {
        /* ignore */
      }
      this.widget.chartInstance = null;
    }
  }

  private syncEchartsThemeFromDocument(): void {
    this.echartsTheme = this.document.documentElement.classList.contains('app-dark')
      ? 'moneytree-dark'
      : 'moneytree-light';
  }

  get isLoading(): boolean {
    return this.widget?.data?.isLoading ?? false;
  }

  get metricNames(): string[] {
    return this.widget?.data?.metricNames ?? [];
  }

  get selectedMetricName(): string {
    return this.widget?.data?.selectedMetricName ?? '';
  }

  get chartOptions(): EChartsOption {
    return (this.widget?.data?.chartOptions ?? {}) as EChartsOption;
  }

  get hasChart(): boolean {
    const s = this.widget?.data?.chartOptions?.series;
    const first = Array.isArray(s) ? s[0] : null;
    const d = first?.data;
    return Array.isArray(d) && d.length > 0;
  }

  get emptyMessage(): string {
    return this.widget?.data?.emptyMessage ?? 'No peer metrics';
  }

  get peerAvgLegend(): string {
    const s = this.widget?.data?.peerAvgLegend;
    return typeof s === 'string' && s.trim() ? s.trim() : '';
  }

  onMetricChange(name: string): void {
    const fn = this.widget?.data?.onMetricChange;
    if (typeof fn === 'function') {
      fn(name);
    }
  }

  onChartInit(instance: unknown): void {
    if (this.widget) {
      this.widget.chartInstance = instance as NonNullable<IWidget['chartInstance']>;
    }
  }

  onChartDblClick(raw: unknown): void {
    const p = raw as {
      data?: { peerSymbol?: string; value?: number } | number;
      name?: string;
    };
    let sym: string | undefined;
    if (p?.data != null && typeof p.data === 'object' && 'peerSymbol' in p.data) {
      sym = (p.data as { peerSymbol: string }).peerSymbol;
    }
    if (!sym?.trim()) {
      return;
    }
    const cb = this.widget?.data?.onPeerBarDoubleClick as ((s: string) => void) | undefined;
    if (typeof cb === 'function') {
      cb(sym);
      return;
    }
    this.router.navigate(['/stock-insights', sym, 'overview']);
  }
}
