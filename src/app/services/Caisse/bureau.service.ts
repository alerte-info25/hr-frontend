import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  BureauFilters,
  BureauModel,
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

  getAll(filters?: BureauFilters): Observable<BureauModel[]> {
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
          return res.data.data; // extraire le tableau
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
        // ne rien retourner, data est null
      }),
    );
  }

}
