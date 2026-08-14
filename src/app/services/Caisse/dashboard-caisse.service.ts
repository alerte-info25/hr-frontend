import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  DashboardData,
  DashboardFilters,
} from '../../models/Caisse/dashboard.model';
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

  // NOUVELLE MÉTHODE : Récupérer les données avec filtres
  getDashboardData(filters?: DashboardFilters): Observable<DashboardData> {
    let params = new HttpParams();

    if (filters?.exercice_rfk) {
      params = params.set('exercice_rfk', filters.exercice_rfk);
    }
    if (filters?.type_operation) {
      params = params.set('type_operation', filters.type_operation);
    }
    if (
      filters?.a_comptabiliser !== undefined &&
      filters?.a_comptabiliser !== null
    ) {
      params = params.set(
        'a_comptabiliser',
        filters.a_comptabiliser.toString(),
      );
    }

    return this.http
      .get<{
        success: boolean;
        data: DashboardData;
      }>(`${this.apiUrl}caisse/dashboard`, { params })
      .pipe(map((res) => res.data));
  }
}
