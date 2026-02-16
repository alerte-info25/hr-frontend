import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class BilanService {

  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}bilan-trimestriel`);
  }
  getBilanByEmp(slug:string){
    return this.http.get<any>(`${environment.apiUrl}bilan-employes/${slug}`);
  }
  addBilan(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}bilan-trimestriel`, data);
  }
  getBilanBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}bilan-edit/${slug}`);
  }
  getBilanDetails(slug: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}bilan-details/${slug}`);
  }
  updateBilan(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}bilan-update/${slug}`,data);
  }
  deleteBilan(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}bilan-delete/${slug}`);
  }
}
