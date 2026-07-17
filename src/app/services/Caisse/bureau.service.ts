import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  BureauDetailData,
  BureauFilters,
  BureauModel,
  BureauOperationsFilters,
  BureauPayload,
  BureauStats,
  PaginatedResponse,
} from '../../models/Caisse/bureau.model';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BureauService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/bureaux`;

  // Retourne la réponse paginée complète (current_page, last_page, total, data...)
  getAll(filters?: BureauFilters): Observable<PaginatedResponse<BureauModel>> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http
      .get<ApiResponse<PaginatedResponse<BureauModel>>>(this.url, { params })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Erreur API');
          }
          return res.data; // PaginatedResponse complet
        }),
      );
  }

  getListe(): Observable<BureauModel[]> {
  return this.http
    .get<ApiResponse<BureauModel[]>>(`${this.url}/liste`)
    .pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Erreur API');
        }
        return res.data;
      }),
    );
}

  getOne(rfk: string): Observable<BureauModel> {
    return this.http.get<ApiResponse<BureauModel>>(`${this.url}/${rfk}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Erreur API');
        }
        return res.data;
      }),
    );
  }

  // Stats globales tous bureaux confondus
  getGlobalStats(): Observable<BureauStats> {
    return this.http
      .get<ApiResponse<BureauStats>>(`${this.url}/global-stats`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Erreur API');
          }
          return res.data;
        }),
      );
  }

  getStats(rfk: string): Observable<BureauStats> {
    return this.http
      .get<ApiResponse<BureauStats>>(`${this.url}/${rfk}/stats`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Erreur API');
          }
          return res.data;
        }),
      );
  }

  getOperations(
    rfk: string,
    filters?: BureauOperationsFilters,
  ): Observable<BureauDetailData> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http
      .get<
        ApiResponse<BureauDetailData>
      >(`${this.url}/${rfk}/operations`, { params })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Erreur API');
          }
          return res.data;
        }),
      );
  }

  create(payload: BureauPayload): Observable<BureauModel> {
    return this.http.post<ApiResponse<BureauModel>>(this.url, payload).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Erreur API');
        }
        return res.data;
      }),
    );
  }

  update(
    rfk: string,
    payload: Partial<BureauPayload>,
  ): Observable<BureauModel> {
    return this.http
      .put<ApiResponse<BureauModel>>(`${this.url}/${rfk}`, payload)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw new Error(res.message || 'Erreur API');
          }
          return res.data;
        }),
      );
  }

  delete(rfk: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(`${this.url}/${rfk}`).pipe(
      map((res) => {
        if (!res.success) {
          throw new Error(res.message || 'Erreur suppression');
        }
      }),
    );
  }
}
