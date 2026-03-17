import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import { map, Observable } from 'rxjs';
import {
  ApiResponse,
  ExerciceFilters,
  ExerciceModel,
  ExercicePayload,
  ExerciceStats,
  PaginatedResponse,
} from '../../models/Caisse/exercice-comptable.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciceComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/exercices`;

  private buildParams(filters?: Record<string, any>): HttpParams {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return params;
  }

  getAll(
    filters?: ExerciceFilters,
  ): Observable<PaginatedResponse<ExerciceModel>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<ExerciceModel>>>(this.url, {
        // ← chevron corrigé
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return {
              ...paginated,
              data: [],
            } as PaginatedResponse<ExerciceModel>;
          }
          return paginated;
        }),
      );
  }

  getTotalToNumberFormat(rfk: string): Observable<{
    total: {
      stats: number;
    };
  }> {
    return this.http.get<{ total: { stats: number } }>(
      `${this.url}/${rfk}/total`,
    );
  }

  getOne(rfk: string): Observable<ExerciceModel> {
    return this.http
      .get<ApiResponse<ExerciceModel>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: ExercicePayload): Observable<ExerciceModel> {
    return this.http
      .post<ApiResponse<ExerciceModel>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(
    rfk: string,
    payload: Partial<ExercicePayload>,
  ): Observable<ExerciceModel> {
    return this.http
      .put<ApiResponse<ExerciceModel>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }

  cloturer(rfk: string): Observable<ExerciceModel> {
    return this.http
      .patch<ApiResponse<ExerciceModel>>(`${this.url}/${rfk}/cloturer`, {})
      .pipe(map((res) => res.data!));
  }

  getStats(rfk: string): Observable<ExerciceStats> {
    return this.http
      .get<ApiResponse<ExerciceStats>>(`${this.url}/${rfk}/stats`)
      .pipe(map((res) => res.data!));
  }

  exportPdf(rfk: string): Observable<Blob> {
    return this.http.get(`${this.url}/${rfk}/export-pdf`, {
      responseType: 'blob',
    });
  }
}
