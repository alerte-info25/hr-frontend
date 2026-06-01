import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class ZonesService {

  constructor(
    private http: HttpClient
  ) { }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}zones`);
  }

  getZoneByslug(slug: string): Observable<any> {
    return this.http.get<any>(`${environment.apiParc}zones/${slug}`);
  }

  getZonesByBureau(bureauSlug: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}zones/by-bureau/${bureauSlug}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}zones`, data);
  }

  update(slug: string, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiParc}zones/${slug}`, data);
  }

  delete(slug: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiParc}zones/${slug}`);
  }
}
