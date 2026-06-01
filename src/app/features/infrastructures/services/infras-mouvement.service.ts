import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class InfrasMouvementService {

  constructor(
    private http: HttpClient
  ) { }


  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}mouvements`);
  }

  getMouvementByBureau(bureauId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}mouvements/bureau/${bureauId}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}mouvements`, data);
  }

  update(slug: string, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiParc}mouvements}/${slug}`, data);
  }

  valider(data:any,slug: string): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}mouvements/valider/${slug}`, data);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiParc}mouvements/${slug}`);
  }
}
