export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface DatasetSummary {
  id: string;
  title: string;
  category: string;
  source: string;
  portalUrl: string;
  description: string;
  updateFrequency: string;
}

export interface DimensionItem {
  id: string;
  label: string;
  description: string;
  valueType: string;
}

export type DimensionRole =
  | 'SUMMARY'
  | 'GEOGRAPHY'
  | 'TEMPORAL'
  | 'CATEGORICAL'
  | 'MEASURE';

export interface DimensionGroup {
  id: string;
  label: string;
  items: DimensionItem[];
  role?: DimensionRole | null;
  cardinality?: number | null;
  sourceField?: string | null;
  filterable?: boolean;
}

export interface StateMetric {
  state: string;
  stateCode: string;
  value: number;
  unit: string;
  year: string;
}

export interface StateTimeSeriesLine {
  state: string;
  stateCode: string;
  values: number[];
}

/** Multi-year values per state — powers the explorer line-chart widget. */
export interface StateTimeSeries {
  years: number[];
  lines: StateTimeSeriesLine[];
  unit: string;
}

export const STATE_TIME_SERIES_MIN_YEARS = 5;

export interface DatasetDataResponse {
  resourceId: string;
  title: string;
  description: string;
  totalRecords: number;
  fetchedRecords: number;
  offset: number;
  limit: number;
  stateMetrics: StateMetric[];
  dimensionGroups: DimensionGroup[];
  records: Record<string, string>[];
  syncStatus: string;
  cachedAt: string | null;
  recordsCached: number;
  stateTimeSeries?: StateTimeSeries | null;
}

export interface DatasetSyncStatus {
  resourceId: string;
  status: string;
  portalTotal: number;
  cachedRecords: number;
  fetchedAt: string | null;
  syncStartedAt: string | null;
  lastError: string | null;
}

export interface DatasetSyncRun {
  executionId: number;
  resourceId: string;
  jobName: string;
  status: string;
  recordsRead: number;
  recordsWritten: number;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

export interface DatasetSyncHistoryResponse {
  resourceId: string;
  total: number;
  limit: number;
  offset: number;
  runs: DatasetSyncRun[];
}

export interface IngestionSnapshotEntry {
  resourceId: string;
  title: string;
  category: string;
  sourceOrg: string;
  jobName: string;
  status: string;
  portalTotal: number;
  cachedRecords: number;
  fetchedAt: string | null;
  syncStartedAt: string | null;
  lastError: string | null;
  running: boolean;
  lastRun: DatasetSyncRun | null;
}

export interface IngestionSnapshotResponse {
  datasets: IngestionSnapshotEntry[];
}

/** data.gov.in MCA company master resource */
export const MCA_COMPANY_MASTER_RESOURCE_ID = '4dbe5667-7b6b-41d7-82af-211562424d9a';
