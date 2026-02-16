import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class TypePermissionsService {
constructor(
    private http: HttpClient
  ) { }
  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}type-permissions`);
  }

  getTypePermissionBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}type-permissions/${slug}`);
  }
  addTypePermission(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}type-permissions`, data);
  }
  updateTypePermission(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}type-permissions-update/${slug}`,data);
  }
  deleteTypePermission(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}type-permissions/${slug}`);
  }
}
