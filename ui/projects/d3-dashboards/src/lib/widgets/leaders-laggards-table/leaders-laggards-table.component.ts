import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-leaders-laggards-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table aria-label="Leaders and laggards">
      <tr><th>Symbol</th><th>Score</th></tr>
      @for (row of rows; track row.symbol) { <tr><td>{{ row.symbol }}</td><td>{{ row.breadthScore }}</td></tr> }
    </table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadersLaggardsTableComponent {
  @Input() rows: Array<{ symbol: string; breadthScore: number }> = [];
}
