import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BarChartItem } from '../bar-chart/bar-chart.component';
import {
  formatCompactThousands,
  formatMetricPercent
} from '../../../shared/stats-metric-tooltip.util';
import { statePaletteColor } from '../geography-widget/state-color.util';

export interface DimensionRankEntry {
  id: string;
  label: string;
  rank: number;
  value: number;
  valueLabel: string;
  percentLabel: string;
  percentWidth: number;
  color: string;
}

@Component({
  selector: 'app-dimension-rank-list',
  standalone: true,
  templateUrl: './dimension-rank-list.component.html',
  styleUrl: './dimension-rank-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DimensionRankListComponent {
  @Input() items: readonly BarChartItem[] = [];
  @Input() total = 0;
  @Input() unit = '';
  @Input() selectedIds: readonly string[] = [];
  @Input() dimmedIds: readonly string[] = [];

  @Output() itemClick = new EventEmitter<BarChartItem>();

  rankedItems(): DimensionRankEntry[] {
    const total = this.resolveTotal();
    const sorted = [...this.items].sort((a, b) => b.value - a.value);
    return sorted.map((item, index) => {
      const percentLabel = formatMetricPercent(item.value, total) ?? '0%';
      const percentWidth = total > 0 ? Math.min(100, (item.value / total) * 100) : 0;
      return {
        id: item.id,
        label: item.label,
        rank: index + 1,
        value: item.value,
        valueLabel: formatCompactThousands(item.value),
        percentLabel,
        percentWidth,
        color: statePaletteColor(item.label)
      };
    });
  }

  isSelected(entry: DimensionRankEntry): boolean {
    return this.selectedIds.includes(entry.id) || this.selectedIds.includes(entry.label);
  }

  isDimmed(entry: DimensionRankEntry): boolean {
    if (this.dimmedIds.includes(entry.id) || this.dimmedIds.includes(entry.label)) {
      return true;
    }
    if (this.selectedIds.length && !this.isSelected(entry)) {
      return true;
    }
    return false;
  }

  onClick(item: BarChartItem): void {
    this.itemClick.emit(item);
  }

  private resolveTotal(): number {
    if (this.total > 0) {
      return this.total;
    }
    return this.items.reduce((sum, item) => sum + item.value, 0);
  }
}
