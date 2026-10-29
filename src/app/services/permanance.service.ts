import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class PermananceService {

  constructor(private http: HttpClient) {}

  getSemaine(date: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}permanences/semaine?date=${date}`);
  }

  getEmployesDuService(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}permanences/employes`);
  }

  savePlanning(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}permanences/save`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}permanences/${id}`);
  }
}
