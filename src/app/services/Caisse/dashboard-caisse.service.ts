import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DashboardData } from '../../models/Caisse/dashboard.model';
import { environment } from '../../../environments/environment.developpement';

@Injectable({ providedIn: 'root' })
export class DashboardCaisseService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getOverview(exerciceRfk?: string): Observable<DashboardData> {
    let params = new HttpParams();
    if (exerciceRfk) {
      params = params.set('exercice_rfk', exerciceRfk);
    }
    return this.http
      .get<{
        success: boolean;
        data: DashboardData;
      }>(`${this.apiUrl}caisse/dashboard`, { params })
      .pipe(map((res) => res.data));
  }
}
