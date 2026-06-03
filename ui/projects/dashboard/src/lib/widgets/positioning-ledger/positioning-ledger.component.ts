import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-positioning-ledger',
  standalone: true,
  imports: [CommonModule],
  template: `<div aria-label="Positioning ledger">Rows: {{ rows.length }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PositioningLedgerComponent {
  @Input() rows: unknown[] = [];
}
