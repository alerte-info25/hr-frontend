import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class BureauxService {

  constructor(
    private http: HttpClient
  ) { }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}bureaux`);
  }
  sync(): Observable<any> {
    return this.http.post<any>(`${environment.apiParc}bureaux/sync`, {});
  }
}
