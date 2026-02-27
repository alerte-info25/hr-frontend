import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CategorieComptableModel } from '../../models/Caisse/categorie-comptable.model';
import { environment } from '../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root',
})
export class CategorieComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/categories-comptables`;

  getAll() {
    return this.http.get<CategorieComptableModel[]>(this.url);
  }
}
