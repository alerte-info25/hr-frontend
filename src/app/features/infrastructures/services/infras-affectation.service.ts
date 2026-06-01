import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class InfrasAffectationService {

  constructor(
    private http: HttpClient
  ) { }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}affectations`);
  }

  getAffectationByBureau(bureauId:string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}affectations/bureau/${bureauId}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}affectations`, data);
  }

  update(slug: string, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiParc}affectations}/${slug}`, data);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiParc}affectations/${slug}`);
  }
}
