import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.developpement';

@Injectable({
  providedIn: 'root'
})
export class EquipementsService {

  constructor(
    private http: HttpClient
  ) { }

  getList(){
    return this.http.get<any[]>(`${environment.apiParc}equipements`);
  }

  getEquipementBySlug(slug:string){
    return this.http.get<any>(`${environment.apiParc}equipements/${slug}`);
  }

  getEquipementByBureau(bureauId:string){
    return this.http.get<any[]>(`${environment.apiParc}equipements/bureau/${bureauId}`);
  }

  getMouvementsByEquipement(slug:string){
    return this.http.get<any[]>(`${environment.apiParc}equipements/${slug}/mouvements`);
  }

  addEquipement(data: any) {
    return this.http.post<any>(`${environment.apiParc}equipements`, data);
  }

  updateEquipement(slug: string, data: any) {
    return this.http.post<any>(`${environment.apiParc}equipements/${slug}`,data);
  }

  deleteEquipement(slug: string) {
    return this.http.delete<any>(`${environment.apiParc}equipements/${slug}`);
  }

  associerEquipementUtilisateur(slug: string, data: any) {
    return this.http.post<any>(`${environment.apiParc}equipements/${slug}/associer`, data);
  }

  dissocierEquipementUtilisateur(slug: string, data: any) {
    return this.http.post<any>(`${environment.apiParc}equipements/${slug}/dissocier`, data);
  }

  mouvementEquipement(slug: string, data: any) {
    return this.http.post<any>(`${environment.apiParc}equipements/${slug}/mouvements`, data);
  }
}
