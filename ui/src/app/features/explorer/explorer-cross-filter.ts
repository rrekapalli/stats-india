/** One applied cross-widget filter (aligned with d3-dashboards IFilterValues shape). */
export interface ExplorerFilterChip {
  filterColumn: string;
  dimensionLabel: string;
  value: string;
}

/** Cross-filter state shared across explorer visualization widgets. */
export class ExplorerCrossFilter {
  private readonly chips: ExplorerFilterChip[] = [];

  get active(): boolean {
    return this.chips.length > 0;
  }

  getFilters(): readonly ExplorerFilterChip[] {
    return this.chips;
  }

  add(chip: ExplorerFilterChip): boolean {
    const duplicate = this.chips.some(
      c => c.filterColumn === chip.filterColumn && c.value === chip.value
    );
    if (duplicate) {
      return false;
    }
    const withoutColumn = this.chips.filter(c => c.filterColumn !== chip.filterColumn);
    withoutColumn.push(chip);
    this.chips.length = 0;
    this.chips.push(...withoutColumn);
    return true;
  }

  remove(chip: ExplorerFilterChip): void {
    const idx = this.chips.findIndex(
      c => c.filterColumn === chip.filterColumn && c.value === chip.value
    );
    if (idx >= 0) {
      this.chips.splice(idx, 1);
    }
  }

  clear(): void {
    this.chips.length = 0;
  }

  selectedValues(filterColumn: string): string[] {
    return this.chips.filter(c => c.filterColumn === filterColumn).map(c => c.value);
  }

  hasFilterForColumn(filterColumn: string): boolean {
    return this.chips.some(c => c.filterColumn === filterColumn);
  }

  isValueSelected(filterColumn: string, value: string): boolean {
    return this.chips.some(
      c => c.filterColumn === filterColumn && c.value === value.trim()
    );
  }
}
