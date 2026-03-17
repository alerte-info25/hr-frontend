import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import { DashboardData } from '../../models/Caisse/dashboard.model';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardCaisseService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/dashboard`;

  getOverview(): Observable<DashboardData> {
    return this.http
      .get<ApiResponse<DashboardData>>(this.url)
      .pipe(map((res) => res.data!));
  }
}
