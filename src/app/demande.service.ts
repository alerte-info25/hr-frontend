import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class DemandeService {

  constructor(
    private http: HttpClient
  ) { }


  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}demandes`);
  }

  getListByEmp(slug:string): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}demandes-emp/${slug}`);
  }

  addDemande(demandeData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}demandes`, demandeData);
  }

  updateDemande(slug: string, demandeData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}demandes-update/${slug}`, demandeData);
  }

  deleteDemande(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}demandes/${slug}`);
  }
  repondre(reponseData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}demande-response`, reponseData);
  }

  getDemandeDetail(slug: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}demandes/${slug}`);
  }

  updateReponse(reponseSlug: string, reponseData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}demande-response-update/${reponseSlug}`, reponseData);
  }

  deletePiece(slug: string) {
    return this.http.delete(`${environment.apiUrl}reponses-pieces/${slug}`);
  }

}
