/** Cross-filter selection shared across explorer visualization widgets. */
export class ExplorerCrossFilter {
  readonly states = new Set<string>();
  readonly statuses = new Set<string>();

  get active(): boolean {
    return this.states.size > 0 || this.statuses.size > 0;
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

  toggleStatus(status: string): void {
    const key = status.trim();
    if (this.statuses.has(key)) {
      this.statuses.delete(key);
    } else {
      this.statuses.clear();
      this.statuses.add(key);
    }
  }

  isStateSelected(state: string): boolean {
    return this.states.has(state.trim());
  }

  isStatusSelected(status: string): boolean {
    return this.statuses.has(status.trim());
  }

  isStateDimmed(state: string, hasData: boolean): boolean {
    if (!this.active || this.states.size === 0) {
      return false;
    }
    return !this.isStateSelected(state);
  }

  isStatusDimmed(status: string): boolean {
    if (!this.active || this.statuses.size === 0) {
      return false;
    }
    return !this.isStatusSelected(status);
  }

  clear(): void {
    this.states.clear();
    this.statuses.clear();
  }

  summary(): string {
    const parts: string[] = [];
    if (this.states.size) {
      parts.push(`State: ${[...this.states].join(', ')}`);
    }
    if (this.statuses.size) {
      parts.push(`Status: ${[...this.statuses].join(', ')}`);
    }
    return parts.join(' · ');
  }
}
