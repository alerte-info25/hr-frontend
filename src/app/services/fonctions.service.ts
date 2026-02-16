import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class FonctionsService {

  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}fonctions`);
  }

  getFonctionBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}fonctions/${slug}`);
  }
  addFonction(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}fonctions`, data);
  }
  updateFonction(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}fonctions-update/${slug}`,data);
  }
  deleteFonction(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}fonctions/${slug}`);
  }
}
