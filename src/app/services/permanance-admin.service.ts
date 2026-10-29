import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class PermananceAdminService {

  constructor(private http: HttpClient) {}

  getSemaine(date: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}permanences-admin/semaine?date=${date}`);
  }

  getStats(date: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}permanences-admin/stats?date=${date}`);
  }

}
