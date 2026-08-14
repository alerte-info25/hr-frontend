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
    // S'assurer que les paramètres sont correctement formatés
    const params: any = {};

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Pour a_comptabiliser, envoyer "true" ou "false" en string
          if (key === 'a_comptabiliser') {
            params[key] = value ? 'true' : 'false';
          } else {
            params[key] = String(value);
          }
        }
      });
    }

    return this.http
      .get<ApiResponse<PaginatedResponse<Depense>>>(this.url, {
        params: this.buildParams(params),
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

  getStats(
    filters: {
      search?: string;
      bureau_id?: number;
      exercice_id?: number;
      periode_id?: number;
      type_depense_id?: number;
      mode_paiement?: string;
    } = {},
  ): Observable<{
    total_montant: number;
    nombre: number;
    par_type: any[];
    par_bureau: any[];
    par_mode_paiement: any[];
    evolution: any[];
  }> {
    return this.http
      .get<{
        success: boolean;
        data: any;
      }>(`${this.url}/stats`, { params: this.buildParams(filters) })
      .pipe(map((res) => res.data));
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

  // NOUVEAU : Toggle de comptabilisation
  toggleComptabilisation(
    rfk: string,
    aComptabiliser: boolean,
  ): Observable<Depense> {
    return this.http
      .post<
        ApiResponse<Depense>
      >(`${this.url}/${rfk}/toggle-comptabilisation`, { a_comptabiliser: aComptabiliser })
      .pipe(map((res) => res.data!));
  }
}
