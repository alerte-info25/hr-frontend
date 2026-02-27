import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import { Observable } from 'rxjs';
import {
  ExerciceComptable,
  ExerciceComptablePayload,
} from '../../models/Caisse/exercice-comptable.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciceComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/exercices`;

  getAll(): Observable<ExerciceComptable[]> {
    return this.http.get<ExerciceComptable[]>(this.url);
  }

  getTotalToNumberFormat(rfk: string): Observable<{
    total: {
      stats: number;
    };
  }> {
    return this.http.get<{total : {stats: number}}>(`${this.url}/${rfk}/total`);
  }

  getOne(rfk: string): Observable<ExerciceComptable> {
    return this.http.get<ExerciceComptable>(`${this.url}/${rfk}`);
  }

  create(payload: ExerciceComptablePayload): Observable<ExerciceComptable> {
    return this.http.post<ExerciceComptable>(this.url, payload);
  }

  update(
    rfk: string,
    payload: Partial<ExerciceComptablePayload>,
  ): Observable<ExerciceComptable> {
    return this.http.put<ExerciceComptable>(`${this.url}/${rfk}`, payload);
  }

  delete(rfk: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${rfk}`);
  }

  cloturer(rfk: string): Observable<ExerciceComptable> {
    return this.http.patch<ExerciceComptable>(
      `${this.url}/${rfk}/cloturer`,
      {},
    );
  }
}
