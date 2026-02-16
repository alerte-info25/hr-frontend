import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class SanctionService {

  constructor(
    private http: HttpClient
  ) { }

  addSanction(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}sanctionner`, data);
  }

  getAllSanction(): Observable<any> {
    return this.http.get(`${environment.apiUrl}sanctions`);
  }

  updateSanction(slug: string, data:any): Observable<any> {
    return this.http.get(`${environment.apiUrl}sanction-update/${slug}`,data);
  }

  deleteSanction(slug: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}sanction/${slug}`);
  }
}
