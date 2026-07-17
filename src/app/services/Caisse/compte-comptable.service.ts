import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import {
  ApiResponse,
  CompteComptable,
  CompteComptableFilters,
  CompteComptablePayload,
  CompteOperationsData,
  CompteStats,
  PaginatedResponse,
} from '../../models/Caisse/compte-comptable.model';

@Injectable({
  providedIn: 'root',
})
export class CompteComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/comptes-comptables`;

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
    filters?: CompteComptableFilters,
  ): Observable<PaginatedResponse<CompteComptable>> {
    return this.http
      .get<ApiResponse<PaginatedResponse<CompteComptable>>>(this.url, {
        params: this.buildParams(filters),
      })
      .pipe(
        map((res) => {
          const paginated = res.data;
          if (!paginated || !Array.isArray(paginated.data)) {
            return {
              ...paginated,
              data: [],
            } as PaginatedResponse<CompteComptable>;
          }
          return paginated;
        }),
      );
  }

  getListe(): Observable<CompteComptable[]> {
  return this.http
    .get<ApiResponse<CompteComptable[]>>(`${this.url}/liste`)
    .pipe(map((res) => res.data ?? []));
}

  getOne(rfk: string): Observable<CompteComptable> {
    return this.http
      .get<ApiResponse<CompteComptable>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.data!));
  }

  create(payload: CompteComptablePayload): Observable<CompteComptable> {
    return this.http
      .post<ApiResponse<CompteComptable>>(this.url, payload)
      .pipe(map((res) => res.data!));
  }

  update(
    rfk: string,
    payload: Partial<CompteComptablePayload>,
  ): Observable<CompteComptable> {
    return this.http
      .put<ApiResponse<CompteComptable>>(`${this.url}/${rfk}`, payload)
      .pipe(map((res) => res.data!));
  }

  delete(rfk: string): Observable<string> {
    return this.http
      .delete<ApiResponse<null>>(`${this.url}/${rfk}`)
      .pipe(map((res) => res.message!));
  }

  getStats(
    rfk: string,
    filters?: { exercice_id?: number },
  ): Observable<CompteStats> {
    let params = new HttpParams();
    if (filters?.exercice_id) {
      params = params.set('exercice_id', String(filters.exercice_id));
    }
    return this.http
      .get<ApiResponse<CompteStats>>(`${this.url}/${rfk}/stats`, { params })
      .pipe(map((res) => res.data!));
  }

  getOperations(
    rfk: string,
    filters?: {
      exercice_id?: number;
      periode_id?: number;
      type?: 'entree' | 'sortie';
      search?: string;
      per_page?: number;
      page?: number;
    },
  ): Observable<CompteOperationsData> {
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
        ApiResponse<CompteOperationsData>
      >(`${this.url}/${rfk}/operations`, { params })
      .pipe(map((res) => res.data!));
  }
}
