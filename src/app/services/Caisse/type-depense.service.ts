import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  PaginatedResponse,
  TypeDepense,
  TypeDepenseFilters,
  TypeDepensePayload,
} from '../../models/Caisse/type-depense.model';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TypeDepenseService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/types-depenses`;

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
    filters?: TypeDepenseFilters,
  ): Observable<PaginatedResponse<TypeDepense>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<TypeDepense>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return { ...paginated, data: [] } as PaginatedResponse<TypeDepense>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<TypeDepense> {
    return this.http
      .get<ApiResponse<TypeDepense>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: TypeDepensePayload): Observable<TypeDepense> {
    return this.http
      .post<ApiResponse<TypeDepense>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(
    rfk: string,
    payload: Partial<TypeDepensePayload>,
  ): Observable<TypeDepense> {
    return this.http
      .put<ApiResponse<TypeDepense>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }
}
