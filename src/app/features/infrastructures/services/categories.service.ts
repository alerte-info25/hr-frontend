import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {

  constructor(
    private http: HttpClient
  ) { }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}categories`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}categories`, data);
  }

  update(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}categories/update/${slug}`, data);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiParc}categories/${slug}`);
  }
}
