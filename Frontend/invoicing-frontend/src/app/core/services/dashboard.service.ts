import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardData, DashboardStats, MonthlyRevenue, StatusDistribution, ClientRevenue } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private api: ApiService) { }

  getDashboardData(): Observable<DashboardData> {
    return this.api.get<DashboardData>('/dashboard');
  }
  
  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('/dashboard/stats');
  }
  
  getMonthlyRevenue(months: number = 6): Observable<MonthlyRevenue[]> {
    return this.api.get<MonthlyRevenue[]>(`/dashboard/monthly-revenue/${months}`);
  }
  
  getStatusDistribution(): Observable<StatusDistribution[]> {
    return this.api.get<StatusDistribution[]>('/dashboard/status-distribution');
  }
  
  getTopClients(limit: number = 5): Observable<ClientRevenue[]> {
    return this.api.get<ClientRevenue[]>(`/dashboard/top-clients/${limit}`);
  }
} 