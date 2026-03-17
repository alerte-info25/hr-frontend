import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  Depense,
  DepenseFilters,
  DepensePayload,
  PaginatedResponse,
} from '../../models/Caisse/depense.model';

@Injectable({
  providedIn: 'root',
})
export class DepenseService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/depenses`;

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

  getAll(filters?: DepenseFilters): Observable<PaginatedResponse<Depense>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<Depense>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return { ...paginated, data: [] } as PaginatedResponse<Depense>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<Depense> {
    return this.http
      .get<ApiResponse<Depense>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: DepensePayload): Observable<Depense> {
    return this.http
      .post<ApiResponse<Depense>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(rfk: string, payload: Partial<DepensePayload>): Observable<Depense> {
    return this.http
      .put<ApiResponse<Depense>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }
}
