import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class RapportService {

  constructor(
    private http: HttpClient
  ) { }


  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}rapports`);
  }

  getRapportByEmp(slug:string){
    return this.http.get<any>(`${environment.apiUrl}rapports-emp/${slug}`);
  }

  getRapportBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}rapport/${slug}`);
  }

  addRapport(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}rapports`, data);
  }
  updateRapport(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}rapport-update/${slug}`,data);
  }

  changeStatut(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}rapport-statut/${slug}`,data);
  }

  CommenterRapport(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}rapport-comment/${slug}`,data);
  }

  deleteRapport(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}rapport-delete/${slug}`);
  }


}
