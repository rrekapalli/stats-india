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

export interface DimensionGroup {
  id: string;
  label: string;
  items: DimensionItem[];
}

export interface StateMetric {
  state: string;
  stateCode: string;
  value: number;
  unit: string;
  year: string;
}

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
}

/** data.gov.in MCA company master resource */
export const MCA_COMPANY_MASTER_RESOURCE_ID = '4dbe5667-7b6b-41d7-82af-211562424d9a';
