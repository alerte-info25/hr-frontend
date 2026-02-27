import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CompteActif,
  CompteComptableModel,
  CompteComptablePayload,
  SoldeCompte,
} from '../../models/Caisse/compte-comptable.model';

@Injectable({
  providedIn: 'root',
})
export class CompteComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/comptes-comptables`;

  getAll(): Observable<CompteComptableModel[]> {
    return this.http.get<CompteComptableModel[]>(this.url);
  }

  getActifs(): Observable<CompteComptableModel[]> {
    const params = new HttpParams().set('actifs_seulement', 'true');
    return this.http.get<CompteComptableModel[]>(this.url, { params });
  }

  rechercher(terme: string): Observable<CompteComptableModel[]> {
    const params = new HttpParams().set('search', terme);
    return this.http.get<CompteComptableModel[]>(this.url, { params });
  }

  filtrer(params: Record<string, string>): Observable<CompteComptableModel[]> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, value);
    });
    return this.http.get<CompteComptableModel[]>(this.url, {
      params: httpParams,
    });
  }

  getOne(rfk: string): Observable<CompteComptableModel> {
    return this.http.get<CompteComptableModel>(`${this.url}/${rfk}`);
  }

  getTotal(): Observable<{
    total: {
      total: number;
      actifs: number;
      inactifs: number;
    };
  }> {
    return this.http.get<{
      total: {
        total: number;
        actifs: number;
        inactifs: number;
      };
    }>(`${this.url}/count`);
  }

  getTopActifs(): Observable<CompteActif[]> {
    return this.http.get<CompteActif[]>(`${this.url}/top-actifs`);
  }

  create(payload: CompteComptablePayload): Observable<CompteComptableModel> {
    return this.http.post<CompteComptableModel>(this.url, payload);
  }

  update(
    rfk: string,
    payload: Partial<CompteComptablePayload>,
  ): Observable<CompteComptableModel> {
    return this.http.put<CompteComptableModel>(`${this.url}/${rfk}`, payload);
  }

  toggleActif(rfk: string): Observable<CompteComptableModel> {
    return this.http.patch<CompteComptableModel>(
      `${this.url}/${rfk}/toggle-actif`,
      {},
    );
  }

  delete(rfk: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${rfk}`);
  }

  getSolde(rfk: string): Observable<SoldeCompte> {
    return this.http.get<SoldeCompte>(`${this.url}/${rfk}/solde`);
  }
}
