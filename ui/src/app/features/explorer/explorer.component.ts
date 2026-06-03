import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { TagModule } from 'primeng/tag';
import { StatsApiService } from '../../services/stats-api.service';
import {
  DatasetSummary,
  DimensionGroup,
  MCA_COMPANY_MASTER_RESOURCE_ID,
  StateMetric
} from '../../models/dataset.models';
import { IndiaStateMapComponent } from './india-state-map/india-state-map.component';

type LeftDrawer = 'datasets' | 'categories' | null;
type RightDrawer = 'dimensions' | 'filters' | 'map-settings' | 'dataset-info' | null;

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
  liveSampleSize = 0;

  activeLeftDrawer: LeftDrawer = null;
  activeRightDrawer: RightDrawer = null;
  activeTab = 'visualization';
  accordionPanels: string[] = ['summary', 'company-status', 'state'];

  loading = true;
  error: string | null = null;

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
    this.cdr.markForCheck();

    if (dataset.id === MCA_COMPANY_MASTER_RESOURCE_ID) {
      this.loadLiveDataset(dataset.id);
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

  private loadLiveDataset(resourceId: string): void {
    this.api.getDatasetData(resourceId, 0, 1000).subscribe({
      next: data => {
        this.dimensions = data.dimensionGroups;
        this.stateMetrics = data.stateMetrics;
        this.datasetRecords = data.records;
        this.liveTotalRecords = data.totalRecords;
        this.liveSampleSize = data.fetchedRecords;
        this.accordionPanels = data.dimensionGroups.map(g => g.id).slice(0, 4);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Unable to load live dataset from data.gov.in.';
        this.error = message;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isLiveDataset(): boolean {
    return this.selectedDataset?.id === MCA_COMPANY_MASTER_RESOURCE_ID;
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

  maxStatusCount(): number {
    const counts = this.statusBreakdown().map(s => s.count);
    return counts.length ? Math.max(...counts) : 1;
  }
}
