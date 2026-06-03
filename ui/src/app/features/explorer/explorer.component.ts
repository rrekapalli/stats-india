import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { TabsModule } from 'primeng/tabs';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { StatsApiService } from '../../services/stats-api.service';
import {
  DatasetDataResponse,
  DatasetSummary,
  DimensionGroup,
  MCA_COMPANY_MASTER_RESOURCE_ID,
  StateMetric
} from '../../models/dataset.models';
import { IndiaStateMapComponent } from './india-state-map/india-state-map.component';

type LeftDrawer = 'datasets' | 'categories' | null;
type RightDrawer = 'dimensions' | 'filters' | 'map-settings' | 'dataset-info' | null;

interface GlanceTile {
  title: string;
  subtitle: string;
  value: string;
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
    IndiaStateMapComponent
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

    const add = (title: string, subtitle: string, value: string): void => {
      const key = title.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      tiles.push({ title, subtitle, value });
    };

    if (this.isLiveDataset()) {
      if (this.liveTotalRecords) {
        add(
          'Portal total',
          'Records published on data.gov.in',
          this.liveTotalRecords.toLocaleString()
        );
      }
      if (this.recordsCached || this.isSyncInProgress()) {
        const cacheSubtitle = this.isSyncInProgress()
          ? `Sync in progress (${this.syncProgressPercent()}%)`
          : this.cachedAt
            ? `Last synced ${new Date(this.cachedAt).toLocaleDateString()}`
            : 'Stored locally for fast access';
        add('Cached locally', cacheSubtitle, this.recordsCached.toLocaleString());
      }
    }

    if (this.stateMetrics.length) {
      const unit = this.stateMetrics[0]?.unit ?? 'units';
      add(
        'States / UTs',
        'Geographies represented in this dataset',
        String(this.stateMetrics.length)
      );

      const top = this.topStates(1)[0];
      if (top) {
        add(
          'Top state',
          `${top.state} leads by ${unit}`,
          top.value.toLocaleString(undefined, { maximumFractionDigits: 0 })
        );
      }

      if (!this.isLiveDataset()) {
        const total = this.stateMetrics.reduce((sum, m) => sum + m.value, 0);
        add(
          'National total',
          `Sum across all states (${unit})`,
          total.toLocaleString(undefined, { maximumFractionDigits: 0 })
        );
      }
    }

    for (const item of this.summaryHighlights()) {
      const skipLabels = ['total records (portal)', 'records cached locally', 'states / uts represented'];
      if (skipLabels.some(s => item.label.toLowerCase().includes(s))) {
        continue;
      }
      add(item.label, 'Dataset summary', item.value);
    }

    if (!tiles.length && this.selectedDataset) {
      add(this.selectedDataset.category, this.selectedDataset.updateFrequency, '—');
    }

    return tiles;
  }

  maxStatusCount(): number {
    const counts = this.statusBreakdown().map(s => s.count);
    return counts.length ? Math.max(...counts) : 1;
  }
}
