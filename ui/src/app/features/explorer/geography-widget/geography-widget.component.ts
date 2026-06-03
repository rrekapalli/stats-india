import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { StateMetric } from '../../../models/dataset.models';
import {
  formatCompactThousands,
  formatMetricPercent
} from '../../../shared/stats-metric-tooltip.util';
import { IndiaStateMapComponent } from '../india-state-map/india-state-map.component';
import { INDIA_STATE_NAMES, normalizeStateName } from '../india-state-names';
import { statePaletteColor } from './state-color.util';

export interface StateRankingEntry {
  name: string;
  rank: number;
  value: number;
  valueLabel: string;
  percentLabel: string;
  percentWidth: number;
  color: string;
}

@Component({
  selector: 'app-geography-widget',
  standalone: true,
  imports: [IndiaStateMapComponent],
  templateUrl: './geography-widget.component.html',
  styleUrl: './geography-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeographyWidgetComponent {
  @Input() metrics: StateMetric[] = [];
  @Input() mapTitle = 'India — state view';
  @Input() unit = '';
  @Input() totalForPercent = 0;
  @Input() datasetTitle = '';
  @Input() datasetCategory = '';
  @Input() selectedState: string | null = null;
  @Input() dimUnselected = false;

  @Output() stateClick = new EventEmitter<string>();

  rankedStates(): StateRankingEntry[] {
    const metricByState = new Map(
      this.metrics.map(m => [normalizeStateName(m.state), m])
    );
    const total = this.resolveTotal();

    const rows = INDIA_STATE_NAMES.map(name => {
      const metric = metricByState.get(normalizeStateName(name));
      return { name, value: metric?.value ?? 0 };
    }).sort((a, b) => b.value - a.value);

    return rows.map((row, index) => {
      const percentLabel = formatMetricPercent(row.value, total) ?? '0%';
      const percentWidth = total > 0 ? Math.min(100, (row.value / total) * 100) : 0;
      return {
        name: row.name,
        rank: index + 1,
        value: row.value,
        valueLabel: formatCompactThousands(row.value),
        percentLabel,
        percentWidth,
        color: statePaletteColor(row.name)
      };
    });
  }

  isRowDimmed(entry: StateRankingEntry): boolean {
    if (!this.dimUnselected) {
      return false;
    }
    if (this.selectedState && this.selectedState === entry.name) {
      return false;
    }
    return !!this.selectedState;
  }

  isRowSelected(entry: StateRankingEntry): boolean {
    return this.selectedState === entry.name;
  }

  onStateClick(stateName: string): void {
    this.stateClick.emit(stateName);
  }

  private resolveTotal(): number {
    if (this.totalForPercent > 0) {
      return this.totalForPercent;
    }
    return this.metrics.reduce((sum, m) => sum + m.value, 0);
  }
}
