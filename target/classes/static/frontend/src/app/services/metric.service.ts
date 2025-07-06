import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Metric } from '../models/metric.model';

@Injectable({
  providedIn: 'root'
})
export class MetricService {
  private apiUrl = 'http://localhost:8080/api/metrics';

  constructor(private http: HttpClient) { }

  getAllMetrics(): Observable<Metric[]> {
    return this.http.get<Metric[]>(this.apiUrl);
  }

  getMetricById(id: number): Observable<Metric> {
    return this.http.get<Metric>(`${this.apiUrl}/${id}`);
  }

  createMetric(metric: Metric): Observable<Metric> {
    return this.http.post<Metric>(this.apiUrl, metric);
  }

  updateMetric(id: number, metric: Metric): Observable<Metric> {
    return this.http.put<Metric>(`${this.apiUrl}/${id}`, metric);
  }

  deleteMetric(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMetricsByCategory(category: string): Observable<Metric[]> {
    return this.http.get<Metric[]>(`${this.apiUrl}/category/${category}`);
  }

  getMetricsByState(state: string): Observable<Metric[]> {
    return this.http.get<Metric[]>(`${this.apiUrl}/state/${state}`);
  }

  getMetricsByMetric(metric: string): Observable<Metric[]> {
    return this.http.get<Metric[]>(`${this.apiUrl}/metric/${metric}`);
  }

  getMetricsByDateRange(startDate: string, endDate: string): Observable<Metric[]> {
    return this.http.get<Metric[]>(
      `${this.apiUrl}/date-range?startDate=${startDate}&endDate=${endDate}`
    );
  }

  getMetricsByCategoryAndState(category: string, state: string): Observable<Metric[]> {
    return this.http.get<Metric[]>(
      `${this.apiUrl}/category/${category}/state/${state}`
    );
  }
}