import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-sector-heatmap',
  standalone: true,
  imports: [CommonModule],
  template: `<div aria-label="Sector heatmap">Sectors: {{ sectors.length }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SectorHeatmapComponent {
  @Input() sectors: unknown[] = [];
}
