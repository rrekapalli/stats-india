import { DimensionGroup, DimensionItem, DimensionRole } from '../../models/dataset.models';
import { BarChartItem } from './bar-chart/bar-chart.component';

/**
 * Legacy fallback used when {@link DimensionGroup.role} is not set by the server.
 * New code paths should rely on {@link DimensionRole}.
 */
export const RESERVED_DIMENSION_IDS = new Set([
  'summary',
  'state',
  'geography',
  'time',
  'geographic',
  'location'
]);

/** Max distinct values for the horizontal bar slot; above this uses vertical bar. */
export const LOW_CARDINALITY_BAR_MAX = 5;

/** @deprecated Use {@link LOW_CARDINALITY_BAR_MAX}. */
export const PIE_CHART_MAX_VALUES = LOW_CARDINALITY_BAR_MAX;

export type SlotChartType = 'bar-horizontal' | 'bar-vertical';

export interface VisualizationSlot {
  dimensionId: string;
  label: string;
  chartType: SlotChartType;
  cardinality: number;
}

export interface DimensionChartSlots {
  horizontalBar: DimensionGroup | null;
  bar: DimensionGroup | null;
}

export interface DimensionBreakdownOptions {
  /** When dimension items lack numeric counts, split this total across items (catalog datasets). */
  valueTotalHint?: number;
}

const RESERVED_ROLES: ReadonlySet<DimensionRole> = new Set<DimensionRole>([
  'SUMMARY',
  'GEOGRAPHY',
  'TEMPORAL',
  'MEASURE'
]);

export function dimensionItemCount(item: DimensionItem): number {
  const parsed = Number.parseInt(item.valueType, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function labeledItems(group: DimensionGroup): DimensionItem[] {
  return group.items.filter(item => item.label?.trim());
}

/** True if the dimension is handled by map / state bar / KPI tiles (not chart slots). */
function isReservedForFixedSlots(group: DimensionGroup): boolean {
  if (group.role) {
    return RESERVED_ROLES.has(group.role);
  }
  return RESERVED_DIMENSION_IDS.has(group.id);
}

/** Distinct value count: prefer server-supplied cardinality, then numeric items, then labels. */
export function distinctValueCount(group: DimensionGroup): number {
  if (typeof group.cardinality === 'number' && group.cardinality >= 0) {
    return group.cardinality;
  }
  const numeric = group.items.filter(item => dimensionItemCount(item) > 0);
  if (numeric.length > 0) {
    return numeric.length;
  }
  return labeledItems(group).length;
}

/** Dimension groups suitable for horizontal or vertical bar chart slots. */
export function chartableDimensionGroups(dimensions: DimensionGroup[]): DimensionGroup[] {
  return dimensions.filter(group => {
    if (isReservedForFixedSlots(group)) {
      return false;
    }
    if (group.role === 'CATEGORICAL') {
      return distinctValueCount(group) >= 2;
    }
    const numericCount = group.items.filter(item => dimensionItemCount(item) > 0).length;
    if (numericCount >= 2) {
      return true;
    }
    return labeledItems(group).length >= 2;
  });
}

/**
 * Pick concrete chart slots from a dataset's dimensions in server order. The first chartable
 * group with cardinality &gt; {@link LOW_CARDINALITY_BAR_MAX} fills the top-right vertical
 * bar slot; the next chartable group with 2–{@link LOW_CARDINALITY_BAR_MAX} values (excluding
 * the vertical bar dimension) fills the horizontal bar slot below it.
 */
export function resolveVisualizationSlots(dimensions: DimensionGroup[]): VisualizationSlot[] {
  const chartableIds = new Set(chartableDimensionGroups(dimensions).map(group => group.id));
  const ordered = dimensions.filter(group => chartableIds.has(group.id));

  let verticalBarSlot: VisualizationSlot | null = null;
  let horizontalBarSlot: VisualizationSlot | null = null;

  for (const group of ordered) {
    const cardinality = distinctValueCount(group);
    if (!verticalBarSlot && cardinality > LOW_CARDINALITY_BAR_MAX) {
      verticalBarSlot = {
        dimensionId: group.id,
        label: group.label,
        chartType: 'bar-vertical',
        cardinality
      };
    }
  }

  for (const group of ordered) {
    if (verticalBarSlot?.dimensionId === group.id) {
      continue;
    }
    const cardinality = distinctValueCount(group);
    if (
      !horizontalBarSlot &&
      cardinality >= 2 &&
      cardinality <= LOW_CARDINALITY_BAR_MAX
    ) {
      horizontalBarSlot = {
        dimensionId: group.id,
        label: group.label,
        chartType: 'bar-horizontal',
        cardinality
      };
    }
  }

  return [horizontalBarSlot, verticalBarSlot].filter((slot): slot is VisualizationSlot => slot != null);
}

/** @deprecated Use {@link resolveVisualizationSlots} instead. Kept for callers in transition. */
export function resolveDimensionChartSlots(dimensions: DimensionGroup[]): DimensionChartSlots {
  const slots = resolveVisualizationSlots(dimensions);
  const groupsById = new Map(dimensions.map(d => [d.id, d] as const));
  const horizontalSlot = slots.find(s => s.chartType === 'bar-horizontal');
  const barSlot = slots.find(s => s.chartType === 'bar-vertical');
  return {
    horizontalBar: horizontalSlot ? groupsById.get(horizontalSlot.dimensionId) ?? null : null,
    bar: barSlot ? groupsById.get(barSlot.dimensionId) ?? null : null
  };
}

function distributeTotalAcrossLabels(labels: string[], total: number): Map<string, number> {
  const result = new Map<string, number>();
  if (!labels.length || total <= 0) {
    return result;
  }
  const base = Math.floor(total / labels.length);
  let remainder = Math.round(total) - base * labels.length;
  for (const label of labels) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) {
      remainder--;
    }
    result.set(label, base + extra);
  }
  return result;
}

export function dimensionBreakdown(
  group: DimensionGroup,
  options: DimensionBreakdownOptions = {}
): { label: string; count: number }[] {
  const numericRows = group.items
    .map(item => ({
      label: item.label,
      count: dimensionItemCount(item)
    }))
    .filter(row => row.count > 0);

  if (numericRows.length >= 2) {
    return numericRows.sort((a, b) => b.count - a.count);
  }

  const items = labeledItems(group);
  const hint = options.valueTotalHint ?? 0;
  if (items.length >= 2 && hint > 0) {
    const distributed = distributeTotalAcrossLabels(
      items.map(item => item.label),
      hint
    );
    return items
      .map(item => ({
        label: item.label,
        count: distributed.get(item.label) ?? 0
      }))
      .filter(row => row.count > 0)
      .sort((a, b) => b.count - a.count);
  }

  return numericRows.sort((a, b) => b.count - a.count);
}

export function dimensionToBarItems(
  group: DimensionGroup,
  options?: DimensionBreakdownOptions
): BarChartItem[] {
  return dimensionBreakdown(group, options).map(row => ({
    id: row.label,
    label: row.label,
    value: row.count
  }));
}

export function dimensionGroupTotal(
  group: DimensionGroup,
  options?: DimensionBreakdownOptions
): number {
  return dimensionBreakdown(group, options).reduce((sum, row) => sum + row.count, 0);
}
