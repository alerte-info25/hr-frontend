import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.developpement';
import { ClasseComptableModel } from '../../models/Caisse/classe-compte-model';

@Injectable({
  providedIn: 'root',
})
export class ClasseComptableService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}caisse/classes-comptables`

  getAll() {
    return this.http.get<ClasseComptableModel []>(
      this.url
    );
  }
}
