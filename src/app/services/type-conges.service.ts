import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TypeCongesService {

  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}type-conges`);
  }

  getTypeCongeBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}type-conges/${slug}`);
  }
  addTypeConge(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}type-conges`, data);
  }
  updateTypeConge(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}type-conges-update/${slug}`,data);
  }
  deleteTypeConge(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}type-conges/${slug}`);
  }
}
