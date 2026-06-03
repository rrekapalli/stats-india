import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DatasetDataResponse,
  DatasetSummary,
  DatasetSyncStatus,
  DimensionGroup,
  HealthResponse,
  StateMetric
} from '../models/dataset.models';

@Injectable({ providedIn: 'root' })
export class StatsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.base}/health`);
  }

  listDatasets(): Observable<DatasetSummary[]> {
    return this.http.get<DatasetSummary[]>(`${this.base}/datasets`);
  }

  getDataset(id: string): Observable<DatasetSummary> {
    return this.http.get<DatasetSummary>(`${this.base}/datasets/${id}`);
  }

  getDimensions(datasetId: string): Observable<DimensionGroup[]> {
    return this.http.get<DimensionGroup[]>(`${this.base}/datasets/${datasetId}/dimensions`);
  }

  getStateMetrics(datasetId: string): Observable<StateMetric[]> {
    return this.http.get<StateMetric[]>(`${this.base}/datasets/${datasetId}/state-metrics`);
  }

  /** Aggregates + meta only — no row payload (used for dashboard summary). */
  getDatasetSummary(datasetId: string): Observable<DatasetDataResponse> {
    return this.getDatasetData(datasetId, 0, 0, false);
  }

  getDatasetData(
    datasetId: string,
    offset = 0,
    limit = 1000,
    includeRecords = true
  ): Observable<DatasetDataResponse> {
    return this.http.get<DatasetDataResponse>(`${this.base}/datasets/${datasetId}/data`, {
      params: {
        offset: String(offset),
        limit: String(limit),
        includeRecords: String(includeRecords)
      }
    });
  }

  getSyncStatus(datasetId: string): Observable<DatasetSyncStatus> {
    return this.http.get<DatasetSyncStatus>(`${this.base}/datasets/${datasetId}/sync`);
  }

  triggerSync(datasetId: string): Observable<DatasetSyncStatus> {
    return this.http.post<DatasetSyncStatus>(`${this.base}/datasets/${datasetId}/sync`, null);
  }
}
