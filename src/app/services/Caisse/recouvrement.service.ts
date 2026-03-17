import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  PaginatedResponse,
  Recouvrement,
  RecouvrementFilters,
  RecouvrementPayload,
} from '../../models/Caisse/recouvrement.model';

@Injectable({
  providedIn: 'root',
})
export class RecouvrementService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/recouvrements`;

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
    filters?: RecouvrementFilters,
  ): Observable<PaginatedResponse<Recouvrement>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<Recouvrement>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return {
              ...paginated,
              data: [],
            } as PaginatedResponse<Recouvrement>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<Recouvrement> {
    return this.http
      .get<ApiResponse<Recouvrement>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: RecouvrementPayload): Observable<Recouvrement> {
    return this.http
      .post<ApiResponse<Recouvrement>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(
    rfk: string,
    payload: Partial<RecouvrementPayload>,
  ): Observable<Recouvrement> {
    return this.http
      .put<ApiResponse<Recouvrement>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }
}
