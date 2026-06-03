import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
import { ExplorerCrossFilter, ExplorerFilterChip } from './explorer-cross-filter';
import { ExplorerFilterChipsComponent } from './explorer-filter-chips.component';
import { dimensionLabelForFilterColumn } from './explorer-mca-filter.util';
import { INDIA_STATE_NAMES, normalizeStateName } from './india-state-names';
import {
  buildMetricTooltipHtml,
  formatMetricPercent,
  sumValues
} from '../../shared/stats-metric-tooltip.util';
import {
  chartableDimensionGroups,
  dimensionGroupTotal,
  dimensionToBarItems,
  dimensionToPieItems,
  resolveDimensionChartSlots
} from './dimension-chart-layout';

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
    RouterModule,
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
    PieChartComponent,
    ExplorerFilterChipsComponent
  ],
  templateUrl: './explorer.component.html',
  styleUrl: './explorer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExplorerComponent implements OnInit {
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
  accordionPanels: string[] = ['summary'];

  loading = true;
  dataLoading = false;
  error: string | null = null;

  dataFirst = 0;
  dataRows = 25;

  readonly crossFilter = new ExplorerCrossFilter();

  private unfilteredStateMetrics: StateMetric[] = [];
  private unfilteredDimensions: DimensionGroup[] = [];
  filterApplying = false;

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

  selectDataset(dataset: DatasetSummary): void {
    this.selectedDataset = dataset;
    this.error = null;
    this.loading = true;
    this.dataFirst = 0;
    this.datasetRecords = [];
    this.unfilteredStateMetrics = [];
    this.unfilteredDimensions = [];
    this.crossFilter.clear();
    this.cdr.markForCheck();

    if (dataset.id === MCA_COMPANY_MASTER_RESOURCE_ID) {
      this.loadExploreSummary(dataset.id);
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

  /** Load visualization metrics from the local SQLite cache (read-only). */
  private loadExploreSummary(resourceId: string): void {
    this.api.getExploreSummary(resourceId).subscribe({
      next: data => {
        this.applyExploreResponse(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Unable to load cached dataset.';
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

    this.api.getExploreRecords(this.selectedDataset.id, this.dataFirst, this.dataRows).subscribe({
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

  private applyExploreResponse(data: DatasetDataResponse): void {
    this.unfilteredStateMetrics = data.stateMetrics;
    this.unfilteredDimensions = data.dimensionGroups;
    this.liveTotalRecords = data.totalRecords;
    this.recordsCached = data.recordsCached;
    this.syncStatus = data.syncStatus;
    this.cachedAt = data.cachedAt;
    if (this.crossFilter.active) {
      this.applyCrossFiltersFromServer();
    } else {
      this.dimensions = data.dimensionGroups;
      this.stateMetrics = data.stateMetrics;
    }
    this.updateAccordionPanels(this.dimensions);
  }

  private applyCrossFiltersFromServer(): void {
    if (!this.crossFilter.active) {
      this.stateMetrics = this.unfilteredStateMetrics;
      this.dimensions = this.unfilteredDimensions;
      this.updateAccordionPanels(this.dimensions);
      return;
    }
    if (!this.isLiveDataset() || !this.selectedDataset) {
      return;
    }
    this.filterApplying = true;
    this.cdr.markForCheck();
    this.api
      .getExploreFiltered(this.selectedDataset.id, this.crossFilter.getFilters())
      .subscribe({
        next: data => {
          this.stateMetrics = data.stateMetrics;
          this.dimensions = data.dimensionGroups;
          this.filterApplying = false;
          this.updateAccordionPanels(this.dimensions);
          this.cdr.markForCheck();
        },
        error: () => {
          this.filterApplying = false;
          this.cdr.markForCheck();
        }
      });
  }

  private updateAccordionPanels(dimensions: DimensionGroup[]): void {
    const chartable = chartableDimensionGroups(dimensions);
    this.accordionPanels = ['summary', ...chartable.map(g => g.id).slice(0, 4)];
  }

  activeFilterChips(): readonly ExplorerFilterChip[] {
    return this.crossFilter.getFilters();
  }

  addCrossFilter(filterColumn: string, value: string, dimensionLabel?: string): void {
    const label =
      dimensionLabel ??
      dimensionLabelForFilterColumn(filterColumn, this.unfilteredDimensions.length
        ? this.unfilteredDimensions
        : this.dimensions);
    const added = this.crossFilter.add({ filterColumn, dimensionLabel: label, value });
    if (!added) {
      return;
    }
    this.cdr.markForCheck();
    this.applyCrossFiltersFromServer();
  }

  removeCrossFilter(chip: ExplorerFilterChip): void {
    this.crossFilter.remove(chip);
    this.applyCrossFiltersFromServer();
    this.cdr.markForCheck();
  }

  isLiveDataset(): boolean {
    return this.selectedDataset?.id === MCA_COMPANY_MASTER_RESOURCE_ID;
  }

  isSyncInProgress(): boolean {
    return this.syncStatus === 'SYNCING';
  }

  cacheIncomplete(): boolean {
    return this.isLiveDataset() && this.liveTotalRecords > 0 && this.recordsCached < this.liveTotalRecords;
  }

  syncProgressPercent(): number {
    if (!this.liveTotalRecords) {
      return 0;
    }
    return Math.min(100, Math.round((this.recordsCached / this.liveTotalRecords) * 100));
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

  pieDimensionGroup(): DimensionGroup | null {
    return resolveDimensionChartSlots(this.dimensions).pie;
  }

  barDimensionGroup(): DimensionGroup | null {
    return resolveDimensionChartSlots(this.dimensions).bar;
  }

  pieChartItems(): PieChartItem[] {
    const group = this.pieDimensionGroup();
    return group ? dimensionToPieItems(group) : [];
  }

  barChartItems(): BarChartItem[] {
    const group = this.barDimensionGroup();
    return group ? dimensionToBarItems(group) : [];
  }

  pieChartTotal(): number {
    const group = this.pieDimensionGroup();
    return group ? dimensionGroupTotal(group) : 0;
  }

  barChartTotal(): number {
    const group = this.barDimensionGroup();
    return group ? dimensionGroupTotal(group) : 0;
  }

  dimensionBarSelectedIds(dimensionId: string): string[] {
    return this.crossFilter.selectedValues(dimensionId);
  }

  dimensionBarDimmedIds(_dimensionId: string): string[] {
    return [];
  }

  onDimensionBarClick(dimensionId: string, item: BarChartItem): void {
    const group = this.barDimensionGroup();
    this.addCrossFilter(dimensionId, item.label, group?.label);
  }

  onPieSliceClick(item: PieChartItem): void {
    const group = this.pieDimensionGroup();
    if (!group) {
      return;
    }
    this.addCrossFilter(group.id, item.label, group.label);
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
    const values = this.crossFilter.selectedValues('state');
    return values.length ? values[0] : null;
  }

  stateBarSelectedIds(): string[] {
    return this.crossFilter.selectedValues('state');
  }

  stateBarDimmedIds(): string[] {
    return [];
  }

  mapDimUnselected(): boolean {
    return this.crossFilter.hasFilterForColumn('state');
  }

  onMapStateClick(stateName: string): void {
    this.addCrossFilter('state', stateName, 'State');
  }

  onStateBarClick(item: BarChartItem): void {
    this.addCrossFilter('state', item.label, 'State');
  }

  clearCrossFilters(): void {
    this.crossFilter.clear();
    this.stateMetrics = this.unfilteredStateMetrics;
    this.dimensions = this.unfilteredDimensions;
    this.updateAccordionPanels(this.dimensions);
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
    return this.barChartTotal();
  }

  mapTotalForPercent(): number {
    if (this.crossFilter.active && this.isLiveDataset()) {
      return this.stateMetricsTotal();
    }
    if (this.isLiveDataset() && this.recordsCached > 0) {
      return this.recordsCached;
    }
    if (this.isLiveDataset() && this.liveTotalRecords > 0) {
      return this.liveTotalRecords;
    }
    return this.stateMetricsTotal();
  }

  dimensionGroupTotalById(groupId: string): number {
    const group = this.dimensionGroup(groupId);
    return group ? dimensionGroupTotal(group) : 0;
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
    const barGroup = this.barDimensionGroup();
    return buildMetricTooltipHtml({
      title: row.label,
      value: row.count,
      total: this.barChartTotal(),
      unit: this.stateMetrics[0]?.unit ?? 'records',
      subtitle: barGroup ? `Breakdown by ${barGroup.label.toLowerCase()}` : undefined,
      datasetTitle: this.datasetTitleLabel(),
      category: this.datasetCategoryLabel()
    });
  }

  dimensionItemTooltip(item: DimensionItem, groupId: string): string {
    const count = Number.parseInt(item.valueType, 10);
    const total = this.dimensionGroupTotalById(groupId);
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
