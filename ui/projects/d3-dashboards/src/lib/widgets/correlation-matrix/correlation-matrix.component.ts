import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-correlation-matrix',
  standalone: true,
  imports: [CommonModule],
  template: `<div aria-label="Correlation matrix">Pairs: {{ entries.length }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CorrelationMatrixComponent {
  @Input() entries: unknown[] = [];
}
