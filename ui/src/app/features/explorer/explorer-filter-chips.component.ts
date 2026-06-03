import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExplorerFilterChip } from './explorer-cross-filter';

@Component({
  selector: 'app-explorer-filter-chips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explorer-filter-chips.component.html',
  styleUrl: './explorer-filter-chips.component.css'
})
export class ExplorerFilterChipsComponent {
  @Input() filters: readonly ExplorerFilterChip[] = [];
  @Input() applying = false;
  @Output() removeFilter = new EventEmitter<ExplorerFilterChip>();
  @Output() clearAll = new EventEmitter<void>();

  trackChip(_index: number, chip: ExplorerFilterChip): string {
    return `${chip.filterColumn}:${chip.value}`;
  }

  onRemove(chip: ExplorerFilterChip, event: Event): void {
    event.stopPropagation();
    this.removeFilter.emit(chip);
  }

  onClearAll(event: Event): void {
    event.stopPropagation();
    this.clearAll.emit();
  }
}
