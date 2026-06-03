/** Cross-filter selection shared across explorer visualization widgets. */
export class ExplorerCrossFilter {
  readonly states = new Set<string>();
  private readonly dimensions = new Map<string, Set<string>>();

  get active(): boolean {
    return this.states.size > 0 || this.dimensions.size > 0;
  }

  toggleState(state: string): void {
    const key = state.trim();
    if (this.states.has(key)) {
      this.states.delete(key);
    } else {
      this.states.clear();
      this.states.add(key);
    }
  }

  toggleDimension(dimensionId: string, value: string): void {
    const key = value.trim();
    const bucket = this.dimensionsFor(dimensionId);
    if (bucket.has(key)) {
      bucket.delete(key);
      if (bucket.size === 0) {
        this.dimensions.delete(dimensionId);
      }
    } else {
      bucket.clear();
      this.dimensions.set(dimensionId, new Set([key]));
    }
  }

  /** @deprecated Use toggleDimension('company-status', status) */
  toggleStatus(status: string): void {
    this.toggleDimension('company-status', status);
  }

  isStateSelected(state: string): boolean {
    return this.states.has(state.trim());
  }

  isDimensionSelected(dimensionId: string, value: string): boolean {
    return this.dimensionsFor(dimensionId).has(value.trim());
  }

  /** @deprecated Use isDimensionSelected('company-status', status) */
  isStatusSelected(status: string): boolean {
    return this.isDimensionSelected('company-status', status);
  }

  isStateDimmed(state: string): boolean {
    if (!this.active || this.states.size === 0) {
      return false;
    }
    return !this.isStateSelected(state);
  }

  isDimensionDimmed(dimensionId: string, value: string): boolean {
    if (!this.active || !this.dimensions.has(dimensionId)) {
      return false;
    }
    return !this.isDimensionSelected(dimensionId, value);
  }

  /** @deprecated Use isDimensionDimmed('company-status', status) */
  isStatusDimmed(status: string): boolean {
    return this.isDimensionDimmed('company-status', status);
  }

  selectedDimensionValues(dimensionId: string): string[] {
    const bucket = this.dimensions.get(dimensionId);
    return bucket ? [...bucket] : [];
  }

  clear(): void {
    this.states.clear();
    this.dimensions.clear();
  }

  activeDimensionFilters(): { dimensionId: string; values: string[] }[] {
    return [...this.dimensions.entries()].map(([dimensionId, values]) => ({
      dimensionId,
      values: [...values]
    }));
  }

  summary(): string {
    const parts: string[] = [];
    if (this.states.size) {
      parts.push(`State: ${[...this.states].join(', ')}`);
    }
    for (const { dimensionId, values } of this.activeDimensionFilters()) {
      parts.push(`${dimensionId}: ${values.join(', ')}`);
    }
    return parts.join(' · ');
  }

  private dimensionsFor(dimensionId: string): Set<string> {
    let bucket = this.dimensions.get(dimensionId);
    if (!bucket) {
      bucket = new Set();
      this.dimensions.set(dimensionId, bucket);
    }
    return bucket;
  }
}
