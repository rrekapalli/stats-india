import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-base-market-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="base-market-chart" [attr.aria-label]="ariaLabel">
      <ng-content />
    </section>
  `,
  styles: [`
    .base-market-chart {
      display: block;
      width: 100%;
      min-height: 12rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseMarketChartComponent {
  @Input() ariaLabel = 'Market chart';
}
