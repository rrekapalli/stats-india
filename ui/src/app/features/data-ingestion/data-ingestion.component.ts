import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-data-ingestion',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, RouterModule],
  template: `
    <section class="ingestion-page">
      <p-card header="Data Ingestion">
        <p>
          Import and sync datasets from data.gov.in into the local SQLite cache. Explorer reads only from
          that embedded database; use this page to refresh or backfill data.
        </p>
        <p class="muted">Sync controls and job history will be added here.</p>
        <a routerLink="/" pButton label="Back to Explorer" icon="pi pi-compass" class="p-button-outlined"></a>
      </p-card>
    </section>
  `,
  styles: [
    `
      .ingestion-page {
        padding: 1rem;
        max-width: 42rem;
      }
      .muted {
        color: var(--p-text-muted-color, #64748b);
        font-size: 0.9rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataIngestionComponent {}
