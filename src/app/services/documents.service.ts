import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {


  constructor(
    private http: HttpClient
  ) { }
  getListEmploye(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}employes`);
  }
  getDossierByEmp(slug:string){
    return this.http.get<any>(`${environment.apiUrl}dossier-perso/${slug}`);
  }
  addFichier(data: any): Observable<any>{
    return this.http.post<any>(`${environment.apiUrl}dossiers`, data);
  }
  deleteFichier(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}dossiers/${slug}`);
  }

}
