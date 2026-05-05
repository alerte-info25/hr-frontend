import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class BureauService {

  constructor(
    private http: HttpClient
  ) { }

  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}Mbureaux`);
  }

  getBureauBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}Mbureaux/${slug}`);
  }
  addBureau(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}Mbureaux`, data);
  }
  updateBureau(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}Mbureaux-update/${slug}`,data);
  }
  deleteBureau(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}Mbureaux/${slug}`);
  }
}
