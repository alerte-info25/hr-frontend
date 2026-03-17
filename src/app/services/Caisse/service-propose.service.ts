import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import { ApiResponse, PaginatedResponse, ServicePropose, ServiceProposeFilters, ServiceProposePayload } from '../../models/Caisse/service-propose.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceProposeService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/services`;

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
    filters?: ServiceProposeFilters,
  ): Observable<PaginatedResponse<ServicePropose>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<ServicePropose>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return {
              ...paginated,
              data: [],
            } as PaginatedResponse<ServicePropose>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<ServicePropose> {
    return this.http
      .get<ApiResponse<ServicePropose>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: ServiceProposePayload): Observable<ServicePropose> {
    return this.http
      .post<ApiResponse<ServicePropose>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(
    rfk: string,
    payload: Partial<ServiceProposePayload>,
  ): Observable<ServicePropose> {
    return this.http
      .put<ApiResponse<ServicePropose>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }
}
