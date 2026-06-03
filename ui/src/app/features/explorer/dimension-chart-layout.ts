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

export function dimensionItemCount(item: DimensionItem): number {
  const parsed = Number.parseInt(item.valueType, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Dimension groups that expose numeric breakdowns suitable for charts. */
export function chartableDimensionGroups(dimensions: DimensionGroup[]): DimensionGroup[] {
  return dimensions.filter(group => {
    if (RESERVED_DIMENSION_IDS.has(group.id)) {
      return false;
    }
    return group.items.some(item => dimensionItemCount(item) > 0);
  });
}

export function distinctValueCount(group: DimensionGroup): number {
  return group.items.filter(item => dimensionItemCount(item) > 0).length;
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

export function dimensionBreakdown(group: DimensionGroup): { label: string; count: number }[] {
  return group.items
    .map(item => ({
      label: item.label,
      count: dimensionItemCount(item)
    }))
    .filter(row => row.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function dimensionToBarItems(group: DimensionGroup): BarChartItem[] {
  return dimensionBreakdown(group).map(row => ({
    id: row.label,
    label: row.label,
    value: row.count
  }));
}

export function dimensionToPieItems(group: DimensionGroup): PieChartItem[] {
  return dimensionBreakdown(group).map(row => ({
    id: row.label,
    label: row.label,
    value: row.count
  }));
}

export function dimensionGroupTotal(group: DimensionGroup): number {
  return dimensionBreakdown(group).reduce((sum, row) => sum + row.count, 0);
}
