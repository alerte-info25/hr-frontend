import { HttpClient,HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class TachesService {

  constructor(
    private http: HttpClient
  ) { }
  // getList(): Observable<any[]>{
  //   return this.http.get<any[]>(`${environment.apiUrl}taches`);
  // }
   getList(): Observable<any[]> {
    // Récupérer l'utilisateur connecté depuis le localStorage
    const currentUser = JSON.parse(localStorage.getItem('user_token') || '{}');

    // On crée les paramètres à envoyer au backend
    let params = new HttpParams();
    if (currentUser?.id_employe) {
      params = params.set('employe_slug', currentUser.id_employe);
    }
    if (currentUser?.role?.slug) {
      params = params.set('role_slug', currentUser.role.slug);
    }

    // Optionnel : ajouter un token si tu utilises une authentification
    const headers = new HttpHeaders({
      Authorization: `Bearer ${currentUser?.token || ''}`
    });

    return this.http.get<any[]>(`${environment.apiUrl}taches`, { params, headers });
  }
  getTachesBySlug(slug:string){
    return this.http.get<any>(`${environment.apiUrl}taches/${slug}`);
  }
  addTaches(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}taches`, data);
  }
  updateTaches(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}taches-update/${slug}`,data);
  }
  deleteTaches(slug: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}taches/${slug}`);
  }
  viewsTaches(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}taches-views/${slug}`,data);
  }
  progressionTaches(slug: string, data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}taches-progression/${slug}`,data);
  }
}
