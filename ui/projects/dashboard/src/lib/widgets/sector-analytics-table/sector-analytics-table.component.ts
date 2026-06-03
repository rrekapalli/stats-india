import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-sector-analytics-table',
  standalone: true,
  imports: [CommonModule],
  template: `<div aria-label="Sector analytics table">Rows: {{ rows.length }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectorAnalyticsTableComponent {
  @Input() rows: unknown[] = [];
}
