import {
  Component,
  Input,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  AfterViewInit,
  OnInit,
  Inject,
  DOCUMENT,
  ElementRef,
} from '@angular/core';
import {IWidget} from '../../entities/IWidget';
import {CommonModule} from '@angular/common';
import {NgxEchartsDirective, provideEchartsCore} from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { IFilterValues } from '../../entities/IFilterValues';

@Component({
  selector: 'vis-echart',
  standalone: true,
  templateUrl: './echart.component.html',
  styleUrls: ['./echart.component.scss'],
  imports: [CommonModule, NgxEchartsDirective],
  providers: [provideEchartsCore({
    echarts: () => import('echarts'),
  })],
})
export class EchartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() widget!: IWidget;
  @Input() onDataLoad!: EventEmitter<IWidget>;
  @Input() onUpdateFilter!: EventEmitter<any>;
  @ViewChild('chart', { static: false }) chart!: NgxEchartsDirective;

  isSingleClick: boolean = true;
  private isDestroyed = false;

  /** App registers moneytree-light / moneytree-dark (see moneytree-echarts-register.ts). */
  echartsTheme: 'moneytree-light' | 'moneytree-dark' = 'moneytree-light';
  private htmlClassObserver: MutationObserver | null = null;
  /** Re-run ECharts `resize()` when the host gets real dimensions (tabs, flex, Katoid grid settle after first paint). */
  private chartResizeObserver: ResizeObserver | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly hostRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.syncEchartsThemeFromDocument();
    const el = this.document.documentElement;
    this.htmlClassObserver = new MutationObserver(() => {
      this.syncEchartsThemeFromDocument();
      this.cdr.markForCheck();
    });
    this.htmlClassObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
  }

  private syncEchartsThemeFromDocument(): void {
    this.echartsTheme = elHasAppDark(this.document.documentElement) ? 'moneytree-dark' : 'moneytree-light';
  }

  ngAfterViewInit(): void {
    this.attachChartResizeObserver();
    // Ensure chart is properly initialized after view init
    if (this.chart && !this.isDestroyed) {
      setTimeout(() => {
        this.forceChartResize();
      }, 100);
    }
  }

  private attachChartResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined' || this.chartResizeObserver) {
      return;
    }
    const host = this.hostRef.nativeElement;
    this.chartResizeObserver = new ResizeObserver(() => {
      if (this.isDestroyed) {
        return;
      }
      const { width, height } = host.getBoundingClientRect();
      if (width < 2 || height < 2) {
        return;
      }
      requestAnimationFrame(() => {
        if (!this.isDestroyed) {
          this.forceChartResize();
        }
      });
    });
    this.chartResizeObserver.observe(host);
  }

  private detachChartResizeObserver(): void {
    this.chartResizeObserver?.disconnect();
    this.chartResizeObserver = null;
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.detachChartResizeObserver();

    // Clean up chart instance first
    if (this.widget?.chartInstance) {
      try {
        this.widget.chartInstance.dispose();
      } catch (error) {
        // Ignore disposal errors
      }
      this.widget.chartInstance = null;
    }
    
    // The ngx-echarts directive will handle its own cleanup in its ngOnDestroy
    // We don't need to manually dispose it since dispose() is private
  }
  
  get chartOptions() {
    return this.widget?.config?.options as EChartsOption;
  }

  onChartInit(instance: any) {
    if (this.isDestroyed) {
      return;
    }
    
    this.widget.chartInstance = instance;
    try {
      instance.setOption({ backgroundColor: 'transparent' });
    } catch {
      /* ignore */
    }
    
    // Check if there are event handlers to set up
    if (this.widget.config?.events?.onChartOptions) {
      this.widget.config.events.onChartOptions(this.widget, instance);
    }
    
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.onDataLoad?.emit(this.widget);
        // Force resize after a short delay to ensure chart uses full height
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.forceChartResize();
          }
        }, 100);
      }
    });
  }

  onChartDblClick(e: any): void {
    this.isSingleClick = false;
    const inst = this.widget?.chartInstance as { __moneytreeTreemapHandleNgxDbl?: (ev: unknown) => void } | null;
    const fn = inst?.__moneytreeTreemapHandleNgxDbl;
    if (typeof fn === 'function') {
      fn(e);
      return;
    }
    this.handleScatterSymbolDeepLink(e);
  }

  private scatterSymbolFromEvent(e: { data?: unknown }): string | null {
    const d = e?.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) {
      return null;
    }
    const row = d as { tradingsymbol?: string; name?: string };
    const sym = (row.tradingsymbol ?? row.name ?? '').trim();
    return sym || null;
  }

  private handleScatterSymbolDeepLink(e: { seriesType?: string; data?: unknown }): void {
    if (e?.seriesType !== 'scatter') {
      return;
    }
    const cfg = this.widget?.config;
    if (cfg?.symbolDeepLink === false) {
      return;
    }
    const sym = this.scatterSymbolFromEvent(e);
    if (!sym) {
      return;
    }
    const base = (cfg?.symbolDeepLinkBasePath || '/stock-insights').replace(/\/$/, '');
    const tab = (cfg?.symbolDeepLinkDetailTab || 'overview').replace(/^\//, '');
    const url = `${base}/${encodeURIComponent(sym)}/${tab}`;
    if (/^https?:\/\//i.test(base)) {
      window.location.href = url;
    } else {
      const path = url.startsWith('/') ? url : `/${url}`;
      window.location.href = `${window.location.origin}${path}`;
    }
  }

  onClick(e: any) {
    this.isSingleClick = true;
    setTimeout(() => {
      let selectedPoint = e.data;
      if(e.seriesType === "scatter") {
        const scatterChartData = e.data.find((item: any) => item.name === this.widget.config.state?.accessor)
        selectedPoint = {
          ...selectedPoint,
          ...scatterChartData as object
        }
      }
      
      // Create filter value(s) from clicked data
      const filterResult = this.createFilterValueFromClickData(selectedPoint, e);
      const filterList: IFilterValues[] = Array.isArray(filterResult)
        ? filterResult
        : filterResult
          ? [filterResult]
          : [];

      for (const fv of filterList) {
        fv['widgetId'] = this.widget.id;
        if (this.widget.config?.header?.title) {
          fv['widgetTitle'] = this.widget.config.header.title;
        }
      }

      if (filterList.length > 1) {
        this.onUpdateFilter.emit({
          value: selectedPoint,
          widget: this.widget,
          filterValues: filterList
        });
      } else if (filterList.length === 1) {
        this.onUpdateFilter.emit({
          value: selectedPoint,
          widget: this.widget,
          filterValue: filterList[0]
        });
      } else {
        // Fallback to original behavior
        this.onUpdateFilter.emit({
          value: selectedPoint,
          widget: this.widget,
        });
      }
    }, 250);
  }

  /**
   * Create filter value from chart click data
   */
  private createFilterValueFromClickData(clickedData: any, event: any): IFilterValues | IFilterValues[] | null {
    const filterColumn = this.widget.config?.filterColumn || this.widget.config?.accessor || 'unknown';

    // Bar charts: `params.data` is often a primitive (e.g. y value), not `{ name, value }` — handle before object-only guard.
    if (event.seriesType === 'bar') {
      let categoryName: string;
      let rawValue: unknown;
      if (
        clickedData != null &&
        typeof clickedData === 'object' &&
        !Array.isArray(clickedData) &&
        (clickedData as { name?: string }).name
      ) {
        categoryName = String((clickedData as { name: string }).name);
        rawValue = (clickedData as { value?: unknown }).value ?? (clickedData as { name: string }).name;
      } else {
        rawValue = clickedData;
        const chartOptions = this.widget.config?.options as {
          xAxis?: { data?: string[] } | Array<{ data?: string[] }>;
          series?: Array<{ data?: unknown[] }>;
        };
        let xAxisData: string[] = [];
        if (chartOptions?.xAxis) {
          if (Array.isArray(chartOptions.xAxis)) {
            xAxisData = chartOptions.xAxis[0]?.data || [];
          } else {
            xAxisData = chartOptions.xAxis.data || [];
          }
        }
        if (xAxisData.length === 0 && chartOptions?.series?.[0]?.data) {
          const seriesData = chartOptions.series[0].data;
          if (Array.isArray(seriesData) && seriesData.length > 0) {
            const first = seriesData[0] as { name?: string } | number;
            if (typeof first === 'object' && first != null && 'name' in first) {
              xAxisData = seriesData.map((item: unknown) =>
                String((item as { name?: string })?.name ?? '')
              );
            }
          }
        }
        if (xAxisData.length > 0 && event.dataIndex !== undefined && event.dataIndex !== null) {
          categoryName = String(xAxisData[event.dataIndex as number] ?? '');
        } else {
          categoryName = rawValue != null && rawValue !== '' ? String(rawValue) : 'Unknown';
        }
      }
      if (!categoryName) {
        return null;
      }
      if (
        filterColumn === 'bankMonth' &&
        (event.seriesName === 'Withdrawals' || event.seriesName === 'Deposits')
      ) {
        return [
          {
            accessor: 'category',
            filterColumn: 'bankMonth',
            category: categoryName,
            value: categoryName
          },
          {
            accessor: 'series',
            filterColumn: 'bankFlowKind',
            category: String(event.seriesName),
            series: String(event.seriesName),
            value: String(event.seriesName)
          }
        ];
      }
      return {
        accessor: 'category',
        filterColumn,
        category: categoryName,
        value: categoryName,
        seriesName: event.seriesName
      };
    }

    if (!clickedData || typeof clickedData !== 'object') {
      return null;
    }

    let filterValue: IFilterValues = {
      accessor: 'unknown',
      filterColumn: filterColumn
    };

    // For pie charts, use the name as the filter key (skip placeholder slices)
    if (clickedData && typeof clickedData === 'object' && clickedData.name && event.seriesType === 'pie') {
      const pieName = String(clickedData.name);
      if (pieName === 'No withdrawals' || pieName === 'No transactions' || pieName === 'No data matches filter') {
        return null;
      }
      filterValue = {
        accessor: 'category',
        filterColumn: filterColumn,
        category: pieName,
        value: pieName,
        percentage: clickedData.value?.toString() || '0'
      };
    }
    // For line charts
    else if (event.seriesType === 'line') {
      filterValue = {
        accessor: 'series',
        filterColumn: filterColumn,
        series: event.seriesName || (clickedData && typeof clickedData === 'object' ? clickedData.name : null),
        value: clickedData && typeof clickedData === 'object' ? clickedData.value : clickedData,
        xAxis: clickedData && Array.isArray(clickedData) ? clickedData[0]?.toString() : null,
        yAxis: clickedData && Array.isArray(clickedData) ? clickedData[1]?.toString() : null
      };
    }
    // Bank statement timeline scatter: prefer structured day/channel metadata when present
    else if (
      event.seriesType === 'scatter' &&
      clickedData &&
      typeof clickedData === 'object' &&
      (clickedData as { bankStmt?: { dayIso?: string } }).bankStmt?.dayIso
    ) {
      const dayIso = (clickedData as { bankStmt: { dayIso: string } }).bankStmt.dayIso;
      filterValue = {
        accessor: 'bankDay',
        filterColumn: filterColumn,
        bankDay: dayIso,
        value: dayIso,
        seriesName: event.seriesName
      };
    }
    // Instrument scatter: prefer symbol/category when filter column targets tradingsymbol
    else if (
      event.seriesType === 'scatter' &&
      clickedData &&
      typeof clickedData === 'object' &&
      (clickedData as { name?: string }).name &&
      /symbol/i.test(filterColumn)
    ) {
      const sym = String((clickedData as { name: string }).name);
      filterValue = {
        accessor: 'category',
        filterColumn: filterColumn,
        category: sym,
        value: sym,
        seriesName: event.seriesName
      };
    }
    // For scatter plots (generic coordinate filter)
    else if (event.seriesType === 'scatter' && clickedData && typeof clickedData === 'object' && clickedData.value && Array.isArray(clickedData.value)) {
      filterValue = {
        accessor: 'coordinates',
        filterColumn: filterColumn,
        x: clickedData.value[0]?.toString(),
        y: clickedData.value[1]?.toString(),
        value: `(${clickedData.value[0]}, ${clickedData.value[1]})`,
        seriesName: event.seriesName
      };
    }
    // Calendar heatmap cells: data is [YYYY-MM-DD, magnitude]
    else if (event.seriesType === 'heatmap' && Array.isArray(clickedData) && clickedData.length >= 1) {
      const dayIso = String(clickedData[0]);
      filterValue = {
        accessor: 'bankDay',
        filterColumn: filterColumn,
        bankDay: dayIso,
        value: dayIso,
        seriesName: event.seriesName
      };
    }
    // For other chart types, try to find meaningful properties
    else if (clickedData && typeof clickedData === 'object') {
      const keys = Object.keys(clickedData);
      if (keys.length > 0) {
        const key = keys[0];
        filterValue = {
          accessor: key,
          filterColumn: filterColumn,
          [key]: clickedData[key],
          value: clickedData[key]?.toString(),
          seriesName: event.seriesName
        };
      }
    } else {
      return null;
    }

    return filterValue.accessor !== 'unknown' ? filterValue : null;
  }

  /**
   * Force chart update when widget data changes
   */
  forceChartUpdate(): void {
    if (!this.isDestroyed && this.widget?.chartInstance) {
      try {
        this.widget.chartInstance.setOption(this.chartOptions);
      } catch (error) {
        // Ignore chart update errors if component is being destroyed
      }
    }
    // Force change detection only if not destroyed
    if (!this.isDestroyed) {
      this.cdr.detectChanges();
    }
  }

  /**
   * Force chart resize to use full widget height
   */
  forceChartResize(): void {
    if (!this.isDestroyed && this.widget?.chartInstance) {
      try {
        this.widget.chartInstance.resize();
      } catch (error) {
        // Ignore resize errors if component is being destroyed
      }
    }
  }
}

function elHasAppDark(html: HTMLElement): boolean {
  return html.classList.contains('app-dark');
}
