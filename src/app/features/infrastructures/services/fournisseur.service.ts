import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {

  constructor(
    private http: HttpClient
  ) { }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}fournisseurs`);
  }
  sync(): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}fournisseurs/sync`, {});
  }
  getFournisseurBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${environment.apiParc}fournisseurs/${slug}`);
  }
  addFournisseur(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}fournisseurs`, data);
  }
  updateFournisseur(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}fournisseurs/${slug}`, data);
  }
  deleteFournisseur(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiParc}fournisseurs/${slug}`);
  }
}
