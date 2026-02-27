import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.developpement';
import {
  OperationComptable,
  OperationComptablePayload,
} from '../../models/Caisse/operation-comptable.model';

@Injectable({
  providedIn: 'root',
})
export class OperationComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/operations`;

  getAll(): Observable<OperationComptable[]> {
    return this.http.get<OperationComptable[]>(this.url);
  }

  getByBureau(bureauRfk: string): Observable<OperationComptable[]> {
    const params = new HttpParams().set('bureau_rfk', bureauRfk);
    return this.http.get<OperationComptable[]>(this.url, { params });
  }

  getByExercice(exerciceRfk: string): Observable<OperationComptable[]> {
    const params = new HttpParams().set('exercice_rfk', exerciceRfk);
    return this.http.get<OperationComptable[]>(this.url, { params });
  }

  getOne(rfk: string): Observable<OperationComptable> {
    return this.http.get<OperationComptable>(`${this.url}/${rfk}`);
  }

  create(payload: OperationComptablePayload): Observable<OperationComptable> {
    return this.http.post<OperationComptable>(this.url, payload);
  }

  update(
    rfk: string,
    payload: Partial<OperationComptablePayload>,
  ): Observable<OperationComptable> {
    return this.http.patch<OperationComptable>(`${this.url}/${rfk}`, payload);
  }

  valider(rfk: string): Observable<OperationComptable> {
    return this.http.patch<OperationComptable>(
      `${this.url}/${rfk}/valider`,
      {},
    );
  }

  annuler(rfk: string): Observable<OperationComptable> {
    return this.http.patch<OperationComptable>(
      `${this.url}/${rfk}/annuler`,
      {},
    );
  }

  delete(rfk: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${rfk}`);
  }

  exportExercicePdf(exerciceRfk: string): Observable<Blob> {
    return this.http.get(
      `${environment.apiUrl}caisse/exports/exercice/${exerciceRfk}/pdf`,
      { responseType: 'blob' },
    );
  }
}
