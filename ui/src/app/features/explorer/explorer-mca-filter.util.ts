import { DimensionGroup, DimensionItem, StateMetric } from '../../models/dataset.models';
import { ExplorerFilterChip } from './explorer-cross-filter';

const STATE_ALIASES: Record<string, string> = {
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andhra pradesh': 'Andhra Pradesh',
  'arunachal pradesh': 'Arunachal Pradesh',
  assam: 'Assam',
  bihar: 'Bihar',
  chandigarh: 'Chandigarh',
  chhattisgarh: 'Chhattisgarh',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli',
  'daman and diu': 'Daman and Diu',
  'daman & diu': 'Daman and Diu',
  delhi: 'Delhi',
  'nct of delhi': 'Delhi',
  'new delhi': 'Delhi',
  goa: 'Goa',
  gujarat: 'Gujarat',
  haryana: 'Haryana',
  'himachal pradesh': 'Himachal Pradesh',
  'jammu and kashmir': 'Jammu and Kashmir',
  'jammu & kashmir': 'Jammu and Kashmir',
  jharkhand: 'Jharkhand',
  karnataka: 'Karnataka',
  kerala: 'Kerala',
  lakshadweep: 'Lakshadweep',
  'madhya pradesh': 'Madhya Pradesh',
  maharashtra: 'Maharashtra',
  manipur: 'Manipur',
  meghalaya: 'Meghalaya',
  mizoram: 'Mizoram',
  nagaland: 'Nagaland',
  odisha: 'Odisha',
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
  punjab: 'Punjab',
  rajasthan: 'Rajasthan',
  sikkim: 'Sikkim',
  'tamil nadu': 'Tamil Nadu',
  telangana: 'Telangana',
  tripura: 'Tripura',
  'uttar pradesh': 'Uttar Pradesh',
  uttarakhand: 'Uttarakhand',
  uttaranchal: 'Uttarakhand',
  'west bengal': 'West Bengal'
};

const DIMENSION_RECORD_FIELD: Record<string, string> = {
  state: 'companyStateCode',
  'company-status': 'companyStatus',
  industry: 'companyIndustrialClassification',
  category: 'companyCategory'
};

export function normalizeMcaState(raw: string | undefined): string | null {
  if (!raw?.trim()) {
    return null;
  }
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (STATE_ALIASES[key]) {
    return STATE_ALIASES[key];
  }
  return titleCase(key);
}

function normalizeMcaLabel(raw: string | undefined): string | null {
  if (!raw?.trim() || raw.trim().toUpperCase() === 'NA') {
    return null;
  }
  return raw.trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map(part =>
      part.length <= 1 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join(' ');
}

function stateCode(stateName: string): string {
  const codes: Record<string, string> = {
    'Andhra Pradesh': 'AP',
    'Arunachal Pradesh': 'AR',
    Assam: 'AS',
    Bihar: 'BR',
    Chhattisgarh: 'CG',
    Delhi: 'DL',
    Goa: 'GA',
    Gujarat: 'GJ',
    Haryana: 'HR',
    'Himachal Pradesh': 'HP',
    'Jammu and Kashmir': 'JK',
    Jharkhand: 'JH',
    Karnataka: 'KA',
    Kerala: 'KL',
    'Madhya Pradesh': 'MP',
    Maharashtra: 'MH',
    Manipur: 'MN',
    Meghalaya: 'ML',
    Mizoram: 'MZ',
    Nagaland: 'NL',
    Odisha: 'OD',
    Punjab: 'PB',
    Rajasthan: 'RJ',
    Sikkim: 'SK',
    'Tamil Nadu': 'TN',
    Telangana: 'TS',
    Tripura: 'TR',
    'Uttar Pradesh': 'UP',
    Uttarakhand: 'UK',
    'West Bengal': 'WB'
  };
  return codes[stateName] ?? '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function dimensionItem(id: string, label: string, description: string, valueType: string): DimensionItem {
  return { id, label, description, valueType };
}

function countGroup(id: string, label: string, counts: Map<string, number>): DimensionGroup {
  const items = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) =>
      dimensionItem(slugify(key), key, `${count} companies`, String(count))
    );
  return { id, label, items };
}

function topEntries(source: Map<string, number>, max: number): Map<string, number> {
  const sorted = [...source.entries()].sort((a, b) => b[1] - a[1]).slice(0, max);
  return new Map(sorted);
}

export interface McaAggregateMeta {
  portalTotal: number;
  recordsCached: number;
  filteredCount: number;
  fetchedAt: string | null;
}

export interface McaAggregates {
  stateMetrics: StateMetric[];
  dimensionGroups: DimensionGroup[];
}

export function filterMcaRecords(
  rows: Record<string, string>[],
  filters: readonly ExplorerFilterChip[]
): Record<string, string>[] {
  if (!filters.length) {
    return rows;
  }
  return rows.filter(row => filters.every(chip => rowMatchesFilter(row, chip)));
}

function rowMatchesFilter(row: Record<string, string>, chip: ExplorerFilterChip): boolean {
  const field = DIMENSION_RECORD_FIELD[chip.filterColumn];
  if (!field) {
    return true;
  }
  const raw = row[field];
  if (chip.filterColumn === 'state') {
    return normalizeMcaState(raw) === chip.value;
  }
  return normalizeMcaLabel(raw) === chip.value;
}

export function aggregateMcaRecords(
  rows: Record<string, string>[],
  meta: McaAggregateMeta
): McaAggregates {
  const byState = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const byIndustry = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const row of rows) {
    const state = normalizeMcaState(row['companyStateCode']);
    if (state) {
      byState.set(state, (byState.get(state) ?? 0) + 1);
    }
    const status = normalizeMcaLabel(row['companyStatus']);
    if (status) {
      byStatus.set(status, (byStatus.get(status) ?? 0) + 1);
    }
    const industry = normalizeMcaLabel(row['companyIndustrialClassification']);
    if (industry) {
      byIndustry.set(industry, (byIndustry.get(industry) ?? 0) + 1);
    }
    const category = normalizeMcaLabel(row['companyCategory']);
    if (category) {
      byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    }
  }

  const stateMetrics: StateMetric[] = [...byState.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([state, value]) => ({
      state,
      stateCode: stateCode(state),
      value,
      unit: 'companies',
      year: meta.filteredCount > 0 && meta.filteredCount < meta.recordsCached ? 'filtered' : 'cached'
    }));

  const summaryItems: DimensionItem[] = [
    dimensionItem('total-records', 'Total records (portal)', String(meta.portalTotal), 'count'),
    dimensionItem(
      'cached-records',
      meta.filteredCount < meta.recordsCached ? 'Records matching filters' : 'Records cached locally',
      String(meta.filteredCount < meta.recordsCached ? meta.filteredCount : meta.recordsCached),
      'count'
    ),
    dimensionItem('states', 'States / UTs represented', String(byState.size), 'count')
  ];
  if (meta.fetchedAt) {
    summaryItems.push(
      dimensionItem('cached-at', 'Last synced', meta.fetchedAt, 'timestamp')
    );
  }

  const dimensionGroups: DimensionGroup[] = [
    { id: 'summary', label: 'Dataset summary', items: summaryItems },
    countGroup('company-status', 'Company status', byStatus),
    countGroup('industry', 'Industrial classification', topEntries(byIndustry, 12)),
    countGroup('category', 'Company category', byCategory),
    countGroup('state', 'State / UT', byState)
  ];

  return { stateMetrics, dimensionGroups };
}

export function dimensionLabelForFilterColumn(
  filterColumn: string,
  dimensions: DimensionGroup[]
): string {
  if (filterColumn === 'state') {
    return 'State';
  }
  return dimensions.find(g => g.id === filterColumn)?.label ?? filterColumn;
}
