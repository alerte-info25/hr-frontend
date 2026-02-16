import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ContratService {


  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}contrats`);
  }

  getContratBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}contrats/${slug}`);
  }
  addContrat(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}contrats`, data);
  }
  updateContrat(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}contrats-update/${slug}`,data);
  }
  deleteContrat(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}contrats/${slug}`);
  }
}
