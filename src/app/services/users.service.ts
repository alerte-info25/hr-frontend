import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

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
  getListeCompte(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}utilisateurs`);
  }
  getCompteBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}utilisateurs/${slug}`);
  }
  addCompte(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}utilisateurs`, data);
  }
  updateCompte(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}utilisateur-update/${slug}`,data);
  }
  deleteCompte(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}utilisateurs/${slug}`);
  }
  changeEtatCompte(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}utilisateur-etat/${slug}`, data);
  }
  changeUserRole(slug: string, data:any): Observable<any>{
    return this.http.post<any>(`${environment.apiUrl}utilisateur-role/${slug}`, data);
  }

}
