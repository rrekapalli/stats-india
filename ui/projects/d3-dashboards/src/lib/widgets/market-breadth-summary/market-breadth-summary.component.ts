import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-market-breadth-summary',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="summary" [attr.aria-label]="ariaLabel">{{ summaryText }}</div>`,
  styles: [`.summary { font-weight: 600; }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarketBreadthSummaryComponent {
  @Input() summaryText = 'Breadth summary';
  @Input() ariaLabel = 'Market breadth summary';
}
