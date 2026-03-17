import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import { ApiResponse, Fournisseur, FournisseurFilters, FournisseurPayload, PaginatedResponse } from '../../models/Caisse/fournisseur.model';

@Injectable({
  providedIn: 'root',
})
export class FournisseurService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/fournisseurs`;

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
    filters?: FournisseurFilters,
  ): Observable<PaginatedResponse<Fournisseur>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<Fournisseur>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return { ...paginated, data: [] } as PaginatedResponse<Fournisseur>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<Fournisseur> {
    return this.http
      .get<ApiResponse<Fournisseur>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: FournisseurPayload): Observable<Fournisseur> {
    return this.http
      .post<ApiResponse<Fournisseur>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(
    rfk: string,
    payload: Partial<FournisseurPayload>,
  ): Observable<Fournisseur> {
    return this.http
      .put<ApiResponse<Fournisseur>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }
}
