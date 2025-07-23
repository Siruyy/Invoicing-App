import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardData, DashboardStats, MonthlyRevenue } from '../models/dashboard.model';

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
  
  getMonthlyRevenue(): Observable<MonthlyRevenue[]> {
    return this.api.get<MonthlyRevenue[]>('/dashboard/monthly-revenue');
  }
} 