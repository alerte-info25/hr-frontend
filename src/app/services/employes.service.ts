import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmployesService {

  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}employes`);
  }
  getEmployesBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}employes/${slug}`);
  }
  addEmployes(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}employes`, data);
  }
  updateEmployes(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}employes-update/${slug}`,data);
  }
  deleteEmployes(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}employes/${slug}`);
  }
}
