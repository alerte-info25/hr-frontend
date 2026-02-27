import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import {
  BureauModel,
  BureauModelPayload,
  BureauStats,
} from '../../models/Caisse/bureau.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BureauService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/bureaux`;

  getAll(): Observable<BureauModel[]> {
    return this.http.get<BureauModel[]>(this.url);
  }

  getOne(rfk: string): Observable<BureauModel> {
    return this.http.get<BureauModel>(`${this.url}/${rfk}`);
  }

  create(payload: BureauModelPayload): Observable<BureauModel> {
    return this.http.post<BureauModel>(this.url, payload);
  }

  update(
    rfk: string,
    payload: Partial<BureauModelPayload>,
  ): Observable<BureauModel> {
    return this.http.put<BureauModel>(`${this.url}/${rfk}`, payload);
  }

  delete(rfk: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${rfk}`);
  }

  getStats(): Observable<BureauStats> {
    return this.http.get<BureauStats>(`${this.url}/stats`);
  }
}
