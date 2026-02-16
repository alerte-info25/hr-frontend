import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TypeContratService {

  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}type-contrats`);
  }

  getTypeContratBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}type-contrats/${slug}`);
  }
  addTypeContrat(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}type-contrats`, data);
  }
  updateTypeContrat(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}type-contrats-update/${slug}`,data);
  }
  deleteTypeContrat(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}type-contrats/${slug}`);
  }
}
