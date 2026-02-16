
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {
  constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}services`);
  }

  getServiceBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}services/${slug}`);
  }
  addService(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}services`, data);
  }
  updateService(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}services-update/${slug}`,data);
  }
  deleteService(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}services/${slug}`);
  }
}
