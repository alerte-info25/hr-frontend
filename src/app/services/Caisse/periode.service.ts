import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  GenererPeriodesPayload,
  Periode,
  PeriodeFilters,
  PaginatedResponse,
} from '../../models/Caisse/periode.model';

@Injectable({
  providedIn: 'root',
})
export class PeriodeService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/periodes`;

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

  getAll(filters?: PeriodeFilters): Observable<PaginatedResponse<Periode>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<Periode>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return { ...paginated, data: [] } as PaginatedResponse<Periode>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<Periode> {
    return this.http
      .get<ApiResponse<Periode>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  cloturer(rfk: string): Observable<Periode> {
    return this.http
      .patch<ApiResponse<Periode>>(`${this.url}/${rfk}/cloturer`, {})
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }

  generer(payload: GenererPeriodesPayload): Observable<Periode[]> {
    return this.http
      .post<ApiResponse<Periode[]>>(`${this.url}/generer`, payload)
      .pipe(map((res) => res.data!));
  }
}
