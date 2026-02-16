import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class CahierChargeService {

  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}cahiers-charges`);
  }
  getCahierByEmp(slug:string){
    return this.http.get<any>(`${environment.apiUrl}cahiers-charges-employe/${slug}`);
  }
  addCahier(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}cahiers-charges`, data);
  }
  updateCahier(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}cahiers-charges-update/${slug}`,data);
  }
  deleteCahier(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}cahiers-charges/${slug}`);
  }
}
