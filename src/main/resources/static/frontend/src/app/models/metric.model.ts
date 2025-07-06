export interface Metric {
  id?: number;
  category: string;
  state: string;
  metric: string;
  value: number;
  recordDate: string;
  source: string;
  description: string;
  comments?: string;
}