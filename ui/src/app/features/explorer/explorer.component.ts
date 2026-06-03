import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { TabsModule } from 'primeng/tabs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { StatsApiService } from '../../services/stats-api.service';
import {
  DatasetDataResponse,
  DatasetSummary,
  DimensionGroup,
  DimensionItem,
  MCA_COMPANY_MASTER_RESOURCE_ID,
  StateMetric
} from '../../models/dataset.models';
import { IndiaStateMapComponent } from './india-state-map/india-state-map.component';
import { BarChartComponent, BarChartItem } from './bar-chart/bar-chart.component';
import { PieChartComponent, PieChartItem } from './pie-chart/pie-chart.component';
import { ExplorerCrossFilter } from './explorer-cross-filter';
import { INDIA_STATE_NAMES, normalizeStateName } from './india-state-names';
import {
  buildMetricTooltipHtml,
  formatMetricPercent,
  sumValues
} from '../../shared/stats-metric-tooltip.util';

type LeftDrawer = 'datasets' | 'categories' | null;
type RightDrawer = 'dimensions' | 'filters' | 'map-settings' | 'dataset-info' | null;

interface GlanceTile {
  title: string;
  subtitle: string;
  value: string;
  numericValue?: number;
  total?: number;
  unit?: string;
}

@Component({
  selector: 'app-explorer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AccordionModule,
    TabsModule,
    TableModule,
    ButtonModule,
    ScrollPanelModule,
    TagModule,
    TooltipModule,
    IndiaStateMapComponent,
    BarChartComponent,
    PieChartComponent
  ],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExplorerComponent implements OnInit, OnDestroy {
  private readonly api = inject(StatsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly mcaResourceId = MCA_COMPANY_MASTER_RESOURCE_ID;

  datasets: DatasetSummary[] = [];
  dimensions: DimensionGroup[] = [];
  stateMetrics: StateMetric[] = [];
  datasetRecords: Record<string, string>[] = [];
  selectedDataset: DatasetSummary | null = null;
  liveTotalRecords = 0;
  recordsCached = 0;
  syncStatus = '';
  cachedAt: string | null = null;

  activeLeftDrawer: LeftDrawer = null;
  activeRightDrawer: RightDrawer = null;
  activeTab = 'visualization';
  accordionPanels: string[] = ['summary', 'company-status', 'state'];

  loading = true;
  dataLoading = false;
  error: string | null = null;

  dataFirst = 0;
  dataRows = 25;

  readonly crossFilter = new ExplorerCrossFilter();

  private syncPollTimer: ReturnType<typeof setInterval> | null = null;

  readonly categories = ['Companies', 'Demographics', 'Agriculture', 'Health', 'Education', 'Energy'];

  ngOnInit(): void {
    this.api.listDatasets().subscribe({
      next: datasets => {
        this.datasets = datasets;
        const live = datasets.find(d => d.id === MCA_COMPANY_MASTER_RESOURCE_ID) ?? datasets[0];
        if (live) {
          this.selectDataset(live);
        } else {
          this.loading = false;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Unable to load datasets from the API.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopSyncPolling();
  }

  selectDataset(dataset: DatasetSummary): void {
    this.selectedDataset = dataset;
    this.error = null;
    this.loading = true;
    this.dataFirst = 0;
    this.datasetRecords = [];
    this.crossFilter.clear();
    this.stopSyncPolling();
    this.cdr.markForCheck();

    if (dataset.id === MCA_COMPANY_MASTER_RESOURCE_ID) {
      this.loadLiveDatasetSummary(dataset.id);
      return;
    }

    this.api.getDimensions(dataset.id).subscribe({
      next: dimensions => {
        this.dimensions = dimensions;
        this.cdr.markForCheck();
      }
    });

    this.api.getStateMetrics(dataset.id).subscribe({
      next: metrics => {
        this.stateMetrics = metrics;
        this.datasetRecords = [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Unable to load state metrics.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadLiveDatasetSummary(resourceId: string): void {
    this.api.getDatasetData(resourceId, 0, 0, false).subscribe({
      next: data => {
        this.applyLiveDatasetResponse(data);
        this.loading = false;
        if (this.isSyncInProgress()) {
          this.startSyncPolling(resourceId);
        }
        this.cdr.markForCheck();
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Unable to load dataset from cache.';
        this.error = message;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadDataPage(event?: TableLazyLoadEvent): void {
    if (!this.selectedDataset || !this.isLiveDataset()) {
      return;
    }
    this.dataFirst = event?.first ?? this.dataFirst;
    this.dataRows = event?.rows ?? this.dataRows;
    this.dataLoading = true;
    this.cdr.markForCheck();

    this.api.getDatasetData(this.selectedDataset.id, this.dataFirst, this.dataRows, true).subscribe({
      next: data => {
        this.datasetRecords = data.records;
        this.recordsCached = data.recordsCached;
        this.liveTotalRecords = data.totalRecords;
        this.syncStatus = data.syncStatus;
        this.dataLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.dataLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onDataTabActivated(): void {
    if (this.isLiveDataset() && !this.dataLoading) {
      this.loadDataPage({ first: this.dataFirst, rows: this.dataRows });
    }
  }

  onTabChange(tab: string | number | undefined): void {
    if (tab === 'data') {
      this.onDataTabActivated();
    }
  }

  private applyLiveDatasetResponse(data: DatasetDataResponse): void {
    this.dimensions = data.dimensionGroups;
    this.stateMetrics = data.stateMetrics;
    this.liveTotalRecords = data.totalRecords;
    this.recordsCached = data.recordsCached;
    this.syncStatus = data.syncStatus;
    this.cachedAt = data.cachedAt;
    this.accordionPanels = data.dimensionGroups.map(g => g.id).slice(0, 4);
  }

  isLiveDataset(): boolean {
    return this.selectedDataset?.id === MCA_COMPANY_MASTER_RESOURCE_ID;
  }

  isSyncInProgress(): boolean {
    return this.syncStatus === 'SYNCING' || this.syncStatus === 'MISSING';
  }

  syncProgressPercent(): number {
    if (!this.liveTotalRecords) {
      return 0;
    }
    return Math.min(100, Math.round((this.recordsCached / this.liveTotalRecords) * 100));
  }

  private startSyncPolling(resourceId: string): void {
    this.stopSyncPolling();
    this.syncPollTimer = setInterval(() => {
      this.api.getDatasetData(resourceId, 0, 0, false).subscribe({
        next: data => {
          this.applyLiveDatasetResponse(data);
          if (!this.isSyncInProgress()) {
            this.stopSyncPolling();
          }
          this.cdr.markForCheck();
        }
      });
    }, 5000);
  }

  private stopSyncPolling(): void {
    if (this.syncPollTimer) {
      clearInterval(this.syncPollTimer);
      this.syncPollTimer = null;
    }
  }

  toggleLeftDrawer(drawer: Exclude<LeftDrawer, null>): void {
    this.activeLeftDrawer = this.activeLeftDrawer === drawer ? null : drawer;
    if (this.activeLeftDrawer) {
      this.activeRightDrawer = null;
    }
    this.cdr.markForCheck();
  }

  toggleRightDrawer(drawer: Exclude<RightDrawer, null>): void {
    this.activeRightDrawer = this.activeRightDrawer === drawer ? null : drawer;
    if (this.activeRightDrawer) {
      this.activeLeftDrawer = null;
    }
    this.cdr.markForCheck();
  }

  closeDrawers(): void {
    this.activeLeftDrawer = null;
    this.activeRightDrawer = null;
    this.cdr.markForCheck();
  }

  datasetsByCategory(category: string): DatasetSummary[] {
    return this.datasets.filter(d => d.category === category);
  }

  dimensionGroup(id: string): DimensionGroup | undefined {
    return this.dimensions.find(g => g.id === id);
  }

  statusBreakdown(): { label: string; count: number }[] {
    const group = this.dimensionGroup('company-status');
    if (!group) {
      return [];
    }
    return group.items
      .map(item => ({
        label: item.label,
        count: Number.parseInt(item.valueType, 10) || 0
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  statusBarItems(): BarChartItem[] {
    return this.statusBreakdown().map(row => ({
      id: row.label,
      label: row.label,
      value: row.count
    }));
  }

  categoryBreakdown(): { label: string; count: number }[] {
    const group = this.dimensionGroup('category');
    if (!group) {
      return [];
    }
    return group.items
      .map(item => ({
        label: item.label,
        count: Number.parseInt(item.valueType, 10) || 0
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  categoryPieItems(): PieChartItem[] {
    return this.categoryBreakdown().map(row => ({
      id: row.label,
      label: row.label,
      value: row.count
    }));
  }

  categoryPieTotal(): number {
    return this.dimensionGroupTotal('category') || this.statusTotal();
  }

  allStateBarItems(): BarChartItem[] {
    const metricByState = new Map(
      this.stateMetrics.map(m => [normalizeStateName(m.state), m])
    );
    return INDIA_STATE_NAMES.map(name => {
      const metric = metricByState.get(normalizeStateName(name));
      return {
        id: name,
        label: name,
        value: metric?.value ?? 0
      };
    }).sort((a, b) => b.value - a.value);
  }

  crossFilterSelectedState(): string | null {
    return this.crossFilter.states.size ? [...this.crossFilter.states][0] : null;
  }

  crossFilterSelectedStatus(): string | null {
    return this.crossFilter.statuses.size ? [...this.crossFilter.statuses][0] : null;
  }

  statusBarSelectedIds(): string[] {
    return [...this.crossFilter.statuses];
  }

  statusBarDimmedIds(): string[] {
    if (!this.crossFilter.active || this.crossFilter.statuses.size === 0) {
      return [];
    }
    return this.statusBarItems()
      .filter(item => !this.crossFilter.isStatusSelected(item.id))
      .map(item => item.id);
  }

  stateBarSelectedIds(): string[] {
    return [...this.crossFilter.states];
  }

  stateBarDimmedIds(): string[] {
    if (!this.crossFilter.active || this.crossFilter.states.size === 0) {
      return [];
    }
    return this.allStateBarItems()
      .filter(item => !this.crossFilter.isStateSelected(item.id))
      .map(item => item.id);
  }

  onMapStateClick(stateName: string): void {
    this.crossFilter.toggleState(stateName);
    this.cdr.markForCheck();
  }

  onStatusBarClick(item: BarChartItem): void {
    this.crossFilter.toggleStatus(item.label);
    this.cdr.markForCheck();
  }

  onStateBarClick(item: BarChartItem): void {
    this.crossFilter.toggleState(item.label);
    this.cdr.markForCheck();
  }

  clearCrossFilters(): void {
    this.crossFilter.clear();
    this.cdr.markForCheck();
  }

  topStates(limit = 8): StateMetric[] {
    return [...this.stateMetrics].sort((a, b) => b.value - a.value).slice(0, limit);
  }

  summaryHighlights(): { label: string; value: string }[] {
    const group = this.dimensionGroup('summary');
    if (!group) {
      return [];
    }
    return group.items.slice(0, 4).map(item => ({
      label: item.label,
      value: item.description
    }));
  }

  glanceTiles(): GlanceTile[] {
    const tiles: GlanceTile[] = [];
    const seen = new Set<string>();
    const stateTotal = this.stateMetricsTotal();
    const unit = this.stateMetrics[0]?.unit ?? '';

    const add = (
      title: string,
      subtitle: string,
      value: string,
      numericValue?: number,
      total?: number,
      tileUnit?: string
    ): void => {
      const key = title.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      tiles.push({ title, subtitle, value, numericValue, total, unit: tileUnit });
    };

    if (this.isLiveDataset()) {
      if (this.liveTotalRecords) {
        add(
          'Portal total',
          'Records published on data.gov.in',
          this.liveTotalRecords.toLocaleString(),
          this.liveTotalRecords,
          this.liveTotalRecords,
          'records'
        );
      }
      if (this.recordsCached || this.isSyncInProgress()) {
        const cacheSubtitle = this.isSyncInProgress()
          ? `Sync in progress (${this.syncProgressPercent()}%)`
          : this.cachedAt
            ? `Last synced ${new Date(this.cachedAt).toLocaleDateString()}`
            : 'Stored locally for fast access';
        add(
          'Cached locally',
          cacheSubtitle,
          this.recordsCached.toLocaleString(),
          this.recordsCached,
          this.liveTotalRecords || undefined,
          'records'
        );
      }
    }

    if (this.stateMetrics.length) {
      add(
        'States / UTs',
        'Geographies represented in this dataset',
        String(this.stateMetrics.length),
        this.stateMetrics.length,
        undefined,
        'regions'
      );

      const top = this.topStates(1)[0];
      if (top) {
        add(
          'Top state',
          `${top.state} leads by ${unit || 'value'}`,
          top.value.toLocaleString(undefined, { maximumFractionDigits: 0 }),
          top.value,
          stateTotal || undefined,
          unit
        );
      }

      if (!this.isLiveDataset() && stateTotal > 0) {
        add(
          'National total',
          `Sum across all states${unit ? ` (${unit})` : ''}`,
          stateTotal.toLocaleString(undefined, { maximumFractionDigits: 0 }),
          stateTotal,
          stateTotal,
          unit
        );
      }
    }

    for (const item of this.summaryHighlights()) {
      const skipLabels = ['total records (portal)', 'records cached locally', 'states / uts represented'];
      if (skipLabels.some(s => item.label.toLowerCase().includes(s))) {
        continue;
      }
      const numeric = Number.parseInt(item.value.replace(/,/g, ''), 10);
      add(
        item.label,
        'Dataset summary',
        item.value,
        Number.isFinite(numeric) ? numeric : undefined,
        Number.isFinite(numeric) ? (this.liveTotalRecords || stateTotal || undefined) : undefined,
        unit
      );
    }

    if (!tiles.length && this.selectedDataset) {
      add(this.selectedDataset.category, this.selectedDataset.updateFrequency, '—');
    }

    return tiles;
  }

  stateMetricsTotal(): number {
    return sumValues(this.stateMetrics.map(m => m.value));
  }

  statusTotal(): number {
    return sumValues(this.statusBreakdown().map(s => s.count));
  }

  mapTotalForPercent(): number {
    if (this.isLiveDataset() && this.recordsCached > 0) {
      return this.recordsCached;
    }
    if (this.isLiveDataset() && this.liveTotalRecords > 0) {
      return this.liveTotalRecords;
    }
    return this.stateMetricsTotal();
  }

  dimensionGroupTotal(groupId: string): number {
    const group = this.dimensionGroup(groupId);
    if (!group) {
      return 0;
    }
    return sumValues(group.items.map(item => Number.parseInt(item.valueType, 10) || 0));
  }

  datasetTitleLabel(): string {
    return this.selectedDataset?.title ?? 'Dataset';
  }

  datasetCategoryLabel(): string {
    return this.selectedDataset?.category ?? '';
  }

  tileTooltip(tile: GlanceTile): string {
    return buildMetricTooltipHtml({
      title: tile.title,
      value: tile.numericValue ?? tile.value,
      total: tile.total,
      unit: tile.unit,
      subtitle: tile.subtitle,
      datasetTitle: this.datasetTitleLabel(),
      category: this.datasetCategoryLabel()
    });
  }

  stateMetricTooltip(row: StateMetric): string {
    return buildMetricTooltipHtml({
      title: row.state,
      value: row.value,
      total: this.mapTotalForPercent(),
      unit: row.unit,
      subtitle: row.stateCode ? `State code: ${row.stateCode}` : undefined,
      datasetTitle: this.datasetTitleLabel(),
      category: this.datasetCategoryLabel(),
      rows: row.year ? [{ label: 'Period', value: row.year }] : []
    });
  }

  statusRowTooltip(row: { label: string; count: number }): string {
    return buildMetricTooltipHtml({
      title: row.label,
      value: row.count,
      total: this.statusTotal(),
      unit: this.stateMetrics[0]?.unit ?? 'records',
      subtitle: 'Breakdown by company status',
      datasetTitle: this.datasetTitleLabel(),
      category: this.datasetCategoryLabel()
    });
  }

  dimensionItemTooltip(item: DimensionItem, groupId: string): string {
    const count = Number.parseInt(item.valueType, 10);
    const total = this.dimensionGroupTotal(groupId);
    if (Number.isFinite(count) && count > 0 && total > 0) {
      return buildMetricTooltipHtml({
        title: item.label,
        value: count,
        total,
        unit: this.stateMetrics[0]?.unit ?? 'records',
        subtitle: item.description,
        datasetTitle: this.datasetTitleLabel(),
        category: this.datasetCategoryLabel()
      });
    }
    return buildMetricTooltipHtml({
      title: item.label,
      value: item.description,
      subtitle: item.valueType,
      datasetTitle: this.datasetTitleLabel(),
      category: this.datasetCategoryLabel()
    });
  }

  statusPercent(count: number): string {
    return formatMetricPercent(count, this.statusTotal()) ?? '0%';
  }

  recordTooltip(row: Record<string, string>): string {
    return buildMetricTooltipHtml({
      title: row['companyName'] || 'Company record',
      value: row['companyStatus'] || '—',
      subtitle: row['companyIndustrialClassification'] || undefined,
      datasetTitle: this.datasetTitleLabel(),
      category: this.datasetCategoryLabel(),
      rows: [
        { label: 'State', value: row['companyStateCode'] || '—' },
        { label: 'CIN', value: row['cin'] || '—' },
        { label: 'Registered', value: row['registrationDate'] || '—' }
      ]
    });
  }
}
