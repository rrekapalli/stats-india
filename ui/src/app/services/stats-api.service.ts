import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DatasetDataResponse,
  DatasetSummary,
  DatasetSyncHistoryResponse,
  DatasetSyncStatus,
  DimensionGroup,
  HealthResponse,
  IngestionSnapshotResponse,
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

  /** Explorer: pre-aggregated metrics from local SQLite cache (read-only, fast). */
  getExploreSummary(datasetId: string): Observable<DatasetDataResponse> {
    return this.http.get<DatasetDataResponse>(`${this.base}/datasets/${datasetId}/explore`);
  }

  /** Explorer cross-filter: filtered aggregates from cached rows. */
  getExploreFiltered(
    datasetId: string,
    filters: ReadonlyArray<{ filterColumn: string; value: string }>
  ): Observable<DatasetDataResponse> {
    let params = new HttpParams();
    for (const chip of filters) {
      params = params.append('filter', `${chip.filterColumn}:${chip.value}`);
    }
    return this.http.get<DatasetDataResponse>(`${this.base}/datasets/${datasetId}/explore/filter`, {
      params
    });
  }

  /** Explorer data tab: paginated rows from local SQLite cache. */
  getExploreRecords(
    datasetId: string,
    offset: number,
    limit: number
  ): Observable<DatasetDataResponse> {
    return this.http.get<DatasetDataResponse>(`${this.base}/datasets/${datasetId}/explore/records`, {
      params: {
        offset: String(offset),
        limit: String(limit)
      }
    });
  }

  getSyncStatus(datasetId: string): Observable<DatasetSyncStatus> {
    return this.http.get<DatasetSyncStatus>(`${this.base}/datasets/${datasetId}/sync`);
  }

  triggerSync(datasetId: string): Observable<DatasetSyncStatus> {
    return this.http.post<DatasetSyncStatus>(`${this.base}/datasets/${datasetId}/sync`, null);
  }

  getSyncHistory(
    datasetId: string,
    limit = 50,
    offset = 0
  ): Observable<DatasetSyncHistoryResponse> {
    return this.http.get<DatasetSyncHistoryResponse>(
      `${this.base}/datasets/${datasetId}/sync/history`,
      {
        params: {
          limit: String(limit),
          offset: String(offset)
        }
      }
    );
  }

  getIngestionSnapshot(): Observable<IngestionSnapshotResponse> {
    return this.http.get<IngestionSnapshotResponse>(`${this.base}/ingestion/snapshot`);
  }
}
