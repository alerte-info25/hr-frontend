import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import { TypeCompteComptableModel } from '../../models/Caisse/type-compte-comptable.model';

@Injectable({
  providedIn: 'root',
})
export class TypeCompteComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/types-comptes-comptables`

  getAll() {
    return this.http.get<TypeCompteComptableModel []>(
      this.url
    );
  }
}
