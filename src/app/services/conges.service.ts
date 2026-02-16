import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CongesService {

  constructor(
    private http: HttpClient
  ) { }



  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}conges`);
  }

  getCongeBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}conges/${slug}`);
  }
  getCongeByEmp(slug:string){
    return this.http.get<any>(`${environment.apiUrl}conges-perso/${slug}`);
  }
  addConge(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}conges`, data);
  }
  updateConge(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}conge-update/${slug}`,data);
  }
  responseConge(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}conges-response/${slug}`,data);
  }
  deleteConge(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}conges/${slug}`);
  }
}
