// src/app/services/permission.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { Permission, PermissionStatus, PermissionType, PermissionSummary, UserRole } from '../../data/permission';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(
    private http: HttpClient
  ) { }


  getList(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}permissions`);
  }
  getListPermissionArchiver(): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}permissions-archive`);
  }

  getPermissionDocuments(slug:string): Observable<any[]>{
    return this.http.get<any[]>(`${environment.apiUrl}permissions-documents/${slug}`);
  }

  getPermissionBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}permissions/${slug}`);
  }
  getPermissionByEmp(slug:string){
    return this.http.get<any>(`${environment.apiUrl}permissions-perso/${slug}`);
  }

  addPermission(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}permissions`, data);
  }
  updatePermission(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}permissions-update/${slug}`,data);
  }
  responsePermission(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}permissions-response/${slug}`,data);
  }
  deletePermission(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}permissions/${slug}`);
  }

  archivePermission(slug: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}permissions-archive/${slug}`,{});
  }

  desarchivePermission(slug: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}permissions-desarchiver/${slug}`,{});
  }

  deleteDocument(documentId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}permissions-documents-delete/${documentId}`);
  }
}
