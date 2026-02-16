import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RegisterCodesService {

   constructor(
      private http: HttpClient
    ) { }

   getList(): Observable<any[]>{
      return this.http.get<any[]>(`${environment.apiUrl}register-codes`);
    }


    generateCode(): Observable<any> {
      return this.http.post<any>(`${environment.apiUrl}generate-register-code`,{});
    }
    verifyRegisterCode(code: string): Observable<any> {
      return this.http.post<any>(`${environment.apiUrl}verify-auto-register-code`, { code });
    }
}
