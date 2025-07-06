import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Statistic } from '../models/statistic.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticService {
  private apiUrl = 'http://localhost:8080/api/statistics';

  constructor(private http: HttpClient) { }

  getAllStatistics(): Observable<Statistic[]> {
    return this.http.get<Statistic[]>(this.apiUrl);
  }

  getStatisticById(id: number): Observable<Statistic> {
    return this.http.get<Statistic>(`${this.apiUrl}/${id}`);
  }

  createStatistic(statistic: Statistic): Observable<Statistic> {
    return this.http.post<Statistic>(this.apiUrl, statistic);
  }

  updateStatistic(id: number, statistic: Statistic): Observable<Statistic> {
    return this.http.put<Statistic>(`${this.apiUrl}/${id}`, statistic);
  }

  deleteStatistic(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStatisticsByCategory(category: string): Observable<Statistic[]> {
    return this.http.get<Statistic[]>(`${this.apiUrl}/category/${category}`);
  }

  getStatisticsByState(state: string): Observable<Statistic[]> {
    return this.http.get<Statistic[]>(`${this.apiUrl}/state/${state}`);
  }

  getStatisticsByMetric(metric: string): Observable<Statistic[]> {
    return this.http.get<Statistic[]>(`${this.apiUrl}/metric/${metric}`);
  }

  getStatisticsByDateRange(startDate: string, endDate: string): Observable<Statistic[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    
    return this.http.get<Statistic[]>(`${this.apiUrl}/date-range`, { params });
  }

  getStatisticsByCategoryAndState(category: string, state: string): Observable<Statistic[]> {
    return this.http.get<Statistic[]>(`${this.apiUrl}/category/${category}/state/${state}`);
  }
}