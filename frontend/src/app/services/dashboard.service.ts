import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardStats } from '../models/stats.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Safe base URL formatting
  private baseUrl = environment.apiUrl.replace(/\/$/, '');
  
  // Dashboard stats ka correct API endpoint
  private apiUrl = `${this.baseUrl}/dashboard/stats/`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}
