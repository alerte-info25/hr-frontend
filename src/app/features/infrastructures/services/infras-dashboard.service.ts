import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment.developpement';

export interface DashboardStats {
  totalEquipements: number;
  disponibles: number;
  affectes: number;
  enMaintenance: number;
  reformes: number;
}

export interface BureauStats {
  bureau: string;
  acronyme: string;
  total: number;
  disponibles: number;
  affectes: number;
  tauxUtilisation: number;
}

export interface CategorieStats {
  categorie: string;
  total: number;
  disponibles: number;
  affectes: number;
  enPanne: number;
}

export interface MouvementRecent {
  id: number;
  equipement: string;
  type: string;
  employe: string;
  date: string;
  destination: string;
}

export interface TopEmploye {
  nom: string;
  matricule: string;
  bureau: string;
  nbEquipements: number;
}

export interface AlerteGarantie {
  equipement: string;
  designation: string;
  bureau: string;
  date_garantie_fin: string;
  jours_restants: number;
}

export interface FiltresDashboard {
  date_debut?: string;
  date_fin?: string;
  bureau_slug?: string;
  employe_slug?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InfrasDashboardService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.apiParc}dashboard`;

  getStats(filtres?: FiltresDashboard): Observable<DashboardStats> {
    const params = this.buildParams(filtres);
    return this.http.get<DashboardStats>(`${this.apiUrl}/stats${params}`);
  }

  getStatsByBureau(filtres?: FiltresDashboard): Observable<BureauStats[]> {
    const params = this.buildParams(filtres);
    return this.http.get<BureauStats[]>(`${this.apiUrl}/stats/bureau${params}`);
  }

  getStatsByCategorie(filtres?: FiltresDashboard): Observable<CategorieStats[]> {
    const params = this.buildParams(filtres);
    return this.http.get<CategorieStats[]>(`${this.apiUrl}/stats/categorie${params}`);
  }

  getMouvementsRecents(limit: number = 10, filtres?: FiltresDashboard): Observable<MouvementRecent[]> {
    let params = `?limit=${limit}`;
    if (filtres) {
      params += this.buildParams(filtres);
    }
    return this.http.get<MouvementRecent[]>(`${this.apiUrl}/mouvements/recent${params}`);
  }

  getTopEmployes(limit: number = 5, filtres?: FiltresDashboard): Observable<TopEmploye[]> {
    let params = `?limit=${limit}`;
    if (filtres) {
      params += this.buildParams(filtres);
    }
    return this.http.get<TopEmploye[]>(`${this.apiUrl}/top-employes${params}`);
  }

  getAlertesGarantie(filtres?: FiltresDashboard): Observable<AlerteGarantie[]> {
    const params = this.buildParams(filtres);
    return this.http.get<AlerteGarantie[]>(`${this.apiUrl}/alertes/garantie${params}`);
  }

  getEvolutionMensuelle(annee?: number, filtres?: FiltresDashboard): Observable<any[]> {
    let params = '';
    if (annee) {
      params += `?annee=${annee}`;
    }
    if (filtres) {
      params += (params ? '&' : '?') + this.buildParams(filtres).replace('?', '');
    }
    return this.http.get<any[]>(`${this.apiUrl}/evolution${params}`);
  }

  // Récupérer la liste des bureaux pour les filtres
  getBureaux(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}bureaux`);
  }

  // Récupérer la liste des employés pour les filtres
  getEmployes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiParc}employes`);
  }

  private buildParams(filtres?: FiltresDashboard): string {
    if (!filtres) return '';
    const params = new URLSearchParams();
    if (filtres.date_debut) params.set('date_debut', filtres.date_debut);
    if (filtres.date_fin) params.set('date_fin', filtres.date_fin);
    if (filtres.bureau_slug) params.set('bureau_slug', filtres.bureau_slug);
    if (filtres.employe_slug) params.set('employe_slug', filtres.employe_slug);
    const query = params.toString();
    return query ? `?${query}` : '';
  }
}
