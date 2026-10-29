import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class HoraireTravailService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}service-horaires`);
  }

  getServices(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}service-horaires/services`);
  }

  save(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}service-horaires/save`, data);
  }

  duplicate(data: { source: string; cible: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}service-horaires/duplicate`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}service-horaires/${id}`);
  }
}