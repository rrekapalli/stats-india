import { DimensionGroup, DimensionItem } from '../../models/dataset.models';
import { BarChartItem } from './bar-chart/bar-chart.component';
import { PieChartItem } from './pie-chart/pie-chart.component';

/** Dimensions handled by map / state bar / KPI tiles — not the side pie or bottom bar slots. */
export const RESERVED_DIMENSION_IDS = new Set([
  'summary',
  'state',
  'geography',
  'time',
  'geographic',
  'location'
]);

export const PIE_CHART_MAX_VALUES = 5;

export interface DimensionChartSlots {
  pie: DimensionGroup | null;
  bar: DimensionGroup | null;
}

export interface DimensionBreakdownOptions {
  /** When dimension items lack numeric counts, split this total across items (catalog datasets). */
  valueTotalHint?: number;
}

export function dimensionItemCount(item: DimensionItem): number {
  const parsed = Number.parseInt(item.valueType, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function labeledItems(group: DimensionGroup): DimensionItem[] {
  return group.items.filter(item => item.label?.trim());
}

/** Dimension groups suitable for pie or bar chart slots. */
export function chartableDimensionGroups(dimensions: DimensionGroup[]): DimensionGroup[] {
  return dimensions.filter(group => {
    if (RESERVED_DIMENSION_IDS.has(group.id)) {
      return false;
    }
    const numericCount = group.items.filter(item => dimensionItemCount(item) > 0).length;
    if (numericCount >= 2) {
      return true;
    }
    return labeledItems(group).length >= 2;
  });
}

export function distinctValueCount(group: DimensionGroup): number {
  const numeric = group.items.filter(item => dimensionItemCount(item) > 0);
  if (numeric.length > 0) {
    return numeric.length;
  }
  return labeledItems(group).length;
}

export function resolveDimensionChartSlots(dimensions: DimensionGroup[]): DimensionChartSlots {
  const chartable = chartableDimensionGroups(dimensions);
  let pie: DimensionGroup | null = null;
  let bar: DimensionGroup | null = null;

  for (const group of chartable) {
    const count = distinctValueCount(group);
    if (!pie && count > 0 && count <= PIE_CHART_MAX_VALUES) {
      pie = group;
    }
  }

  for (const group of chartable) {
    const count = distinctValueCount(group);
    if (!bar && count > PIE_CHART_MAX_VALUES) {
      bar = group;
    }
  }

  return { pie, bar };
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

export function dimensionToPieItems(
  group: DimensionGroup,
  options?: DimensionBreakdownOptions
): PieChartItem[] {
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
