import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.developpement';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DroitsService {

  constructor(
    private http: HttpClient
  ) { }
  getListeRole(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}roles`);
  }
  getRoleBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}roles/${slug}`);
  }
  addRole(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}roles`, data);
  }
  updateRole(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}role-update/${slug}`,data);
  }
  deleteRole(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}roles/${slug}`);
  }
  // DROIT
  getListeDroit(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}droits`);
  }
  getDroitBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}droits/${slug}`);
  }
  addDroit(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}droits`, data);
  }
  updateDroit(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}droit-update/${slug}`,data);
  }
  deleteDroit(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}droits/${slug}`);
  }


}
