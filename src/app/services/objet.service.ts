import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ObjetService {

  constructor(
     private http: HttpClient
   ) { }

  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}objets`);
  }
  addObjet(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}objets`, data);
  }
  updateObjet(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}objets-update/${slug}`,data);
  }
  deleteObjet(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}objets/${slug}`);
  }
}
