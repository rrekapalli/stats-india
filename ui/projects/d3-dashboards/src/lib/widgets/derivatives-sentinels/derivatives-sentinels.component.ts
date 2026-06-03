import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-derivatives-sentinels',
  standalone: true,
  imports: [CommonModule],
  template: `<div aria-label="Derivatives sentinels">Sentinels ready: {{ !!data }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DerivativesSentinelsComponent {
  @Input() data: unknown;
}
