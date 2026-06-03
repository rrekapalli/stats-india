import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { interval, of, Subscription } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { StatsApiService } from '../../services/stats-api.service';
import {
  DatasetSyncRun,
  IngestionSnapshotEntry
} from '../../models/dataset.models';

interface SnapshotState {
  loading: boolean;
  error: string | null;
  datasets: IngestionSnapshotEntry[];
}

interface HistoryState {
  loading: boolean;
  error: string | null;
  resourceId: string | null;
  runs: DatasetSyncRun[];
}

@Component({
  selector: 'app-data-ingestion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TabsModule,
    TableModule,
    TagModule,
    TooltipModule,
    ProgressBarModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './data-ingestion.component.html',
  styleUrl: './data-ingestion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataIngestionComponent {
  private readonly api = inject(StatsApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly snapshot = signal<SnapshotState>({
    loading: true,
    error: null,
    datasets: []
  });
  protected readonly searchText = signal('');
  protected readonly selectedResourceId = signal<string | null>(null);
  protected readonly activeTab = signal<'details' | 'history'>('details');
  protected readonly history = signal<HistoryState>({
    loading: false,
    error: null,
    resourceId: null,
    runs: []
  });
  protected readonly triggering = signal(false);
  protected readonly triggerError = signal<string | null>(null);

  protected readonly filteredDatasets = computed(() => {
    const term = this.searchText().trim().toLowerCase();
    const datasets = this.snapshot().datasets;
    if (!term) {
      return datasets;
    }
    return datasets.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.sourceOrg.toLowerCase().includes(term) ||
        d.jobName.toLowerCase().includes(term)
    );
  });

  protected readonly selectedDataset = computed(() =>
    this.snapshot().datasets.find(
      (d) => d.resourceId === this.selectedResourceId()
    ) ?? null
  );

  protected readonly totalDatasets = computed(() => this.snapshot().datasets.length);
  protected readonly runningCount = computed(
    () => this.snapshot().datasets.filter((d) => d.running).length
  );
  protected readonly readyCount = computed(
    () => this.snapshot().datasets.filter((d) => d.status === 'READY').length
  );

  private historyPollSub: Subscription | null = null;

  constructor() {
    this.loadSnapshot();
    interval(10_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadSnapshot(true));
  }

  protected selectDataset(entry: IngestionSnapshotEntry): void {
    this.selectedResourceId.set(entry.resourceId);
    this.triggerError.set(null);
    if (this.activeTab() === 'history') {
      this.loadHistory(entry.resourceId);
    }
  }

  protected onTabChange(value: string | number | undefined): void {
    const tab = value === 'history' ? 'history' : 'details';
    this.activeTab.set(tab);
    if (tab === 'history') {
      const resourceId = this.selectedResourceId();
      if (resourceId) {
        this.loadHistory(resourceId);
      }
    }
  }

  protected fetchData(): void {
    const dataset = this.selectedDataset();
    if (!dataset || dataset.running) {
      return;
    }
    this.triggering.set(true);
    this.triggerError.set(null);
    this.api
      .triggerSync(dataset.resourceId)
      .pipe(
        finalize(() => this.triggering.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => this.loadSnapshot(true),
        error: (err) => {
          const message =
            err?.error?.message ?? err?.message ?? 'Failed to start ingestion';
          this.triggerError.set(String(message));
        }
      });
  }

  protected statusSeverity(
    status: string
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'READY':
      case 'COMPLETED':
        return 'success';
      case 'SYNCING':
      case 'STARTED':
      case 'STARTING':
        return 'info';
      case 'STOPPING':
      case 'STOPPED':
        return 'warn';
      case 'FAILED':
      case 'ERROR':
      case 'ABANDONED':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  protected progressPercent(entry: IngestionSnapshotEntry): number {
    if (!entry.portalTotal || entry.portalTotal <= 0) {
      return 0;
    }
    return Math.min(
      100,
      Math.round((entry.cachedRecords / entry.portalTotal) * 100)
    );
  }

  protected runDuration(run: DatasetSyncRun): string {
    if (!run.startedAt) {
      return '—';
    }
    const start = Date.parse(run.startedAt);
    const end = run.completedAt ? Date.parse(run.completedAt) : Date.now();
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return '—';
    }
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remSec = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remSec}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  protected trackByResourceId(_index: number, entry: IngestionSnapshotEntry): string {
    return entry.resourceId;
  }

  protected trackByExecutionId(_index: number, run: DatasetSyncRun): number {
    return run.executionId;
  }

  private loadSnapshot(silent = false): void {
    if (!silent) {
      this.snapshot.update((s) => ({ ...s, loading: true, error: null }));
    }
    this.api
      .getIngestionSnapshot()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const datasets = response.datasets ?? [];
          this.snapshot.set({ loading: false, error: null, datasets });
          if (!this.selectedResourceId() && datasets.length > 0) {
            this.selectedResourceId.set(datasets[0].resourceId);
          }
          // Refresh history if a running selection is on the History tab.
          if (this.activeTab() === 'history') {
            const resourceId = this.selectedResourceId();
            if (resourceId) {
              this.loadHistory(resourceId, true);
            }
          }
        },
        error: (err) => {
          if (!silent) {
            this.snapshot.set({
              loading: false,
              error: err?.message ?? 'Failed to load datasets',
              datasets: []
            });
          }
        }
      });
  }

  private loadHistory(resourceId: string, silent = false): void {
    if (!silent) {
      this.history.set({
        loading: true,
        error: null,
        resourceId,
        runs: []
      });
    }
    this.historyPollSub?.unsubscribe();
    this.historyPollSub = this.api
      .getSyncHistory(resourceId, 50, 0)
      .pipe(
        catchError((err) => {
          this.history.update((h) => ({
            ...h,
            loading: false,
            error: err?.message ?? 'Failed to load history'
          }));
          return of(null);
        }),
        switchMap((response) => {
          if (response) {
            this.history.set({
              loading: false,
              error: null,
              resourceId,
              runs: response.runs ?? []
            });
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
