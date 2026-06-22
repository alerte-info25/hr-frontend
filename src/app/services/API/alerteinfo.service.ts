import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlerteinfoService {


  private apiUrl = 'https://api-alerteinfo.alerteinfo-mairie.com/api/v1';

  constructor(private http: HttpClient) {}

  getJournalisteStats(rhSlug: string, annee: number, trimestre: number): Observable<any> {
    const params = new HttpParams()
      .set('rh_slug', rhSlug)
      .set('annee', annee.toString())
      .set('trimestre', trimestre.toString());

    return this.http.get(`${this.apiUrl}/journaliste/stats`, { params });
  }
}
