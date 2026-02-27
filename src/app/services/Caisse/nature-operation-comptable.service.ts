import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import {
  NatureOperationComptable,
  NatureOperationComptablePayload,
} from '../../models/Caisse/nature-operation-comptable.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NatureOperationComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/natures-operations`;

  getAll(): Observable<NatureOperationComptable[]> {
    return this.http.get<NatureOperationComptable[]>(this.url);
  }

  getOne(rfk: string): Observable<NatureOperationComptable> {
    return this.http.get<NatureOperationComptable>(`${this.url}/${rfk}`);
  }

  create(
    payload: NatureOperationComptablePayload,
  ): Observable<NatureOperationComptable> {
    return this.http.post<NatureOperationComptable>(this.url, payload);
  }

  update(
    rfk: string,
    payload: Partial<NatureOperationComptablePayload>,
  ): Observable<NatureOperationComptable> {
    return this.http.put<NatureOperationComptable>(
      `${this.url}/${rfk}`,
      payload,
    );
  }

  delete(rfk: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${rfk}`);
  }
}
