import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-fii-dii-flows-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div [attr.aria-label]="ariaLabel">FII/DII flow points: {{ points.length }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FiiDiiFlowsChartComponent {
  @Input() points: unknown[] = [];
  @Input() ariaLabel = 'Institutional flow chart';
}
