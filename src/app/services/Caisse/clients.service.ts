import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  Client,
  ClientFilters,
  ClientPayload,
  PaginatedResponse,
} from '../../models/Caisse/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/clients`;

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

  getAll(filters?: ClientFilters): Observable<PaginatedResponse<Client>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<Client>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return { ...paginated, data: [] } as PaginatedResponse<Client>;
          }
          return paginated;
        }),
      );
  }

  getOne(rfk: string): Observable<Client> {
    return this.http
      .get<ApiResponse<Client>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: ClientPayload): Observable<Client> {
    return this.http
      .post<ApiResponse<Client>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(rfk: string, payload: Partial<ClientPayload>): Observable<Client> {
    return this.http
      .put<ApiResponse<Client>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }
}
