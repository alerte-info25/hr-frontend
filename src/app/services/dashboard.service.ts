import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

export interface DashboardFilters {
  periode?: 'jour' | 'semaine' | 'mois' | 'annee' | 'personnalise';
  date_debut?: string;
  date_fin?: string;
  statut?: string;
  type_id?: string;
  employe_id?: string;
}

export interface EmployeOption {
  slug: string;
  nom_complet: string;
}

export interface KPI {
  valeur: number;
  tendance?: number;
  pourcentage?: number;
  libelle: string;
}

export interface KPIs {
  total: KPI;
  en_attente: KPI;
  approuvees: KPI;
  refusees: KPI;
  taux_approbation: number;
}

export interface EvolutionData {
  periode: string;
  total: number;
  approuvees: number;
  refusees: number;
  en_attente: number;
}

export interface RepartitionStatut {
  statut: string;
  total: number;
  couleur: string;
}

export interface RepartitionType {
  type: string;
  total: number;
}

export interface TempsTraitement {
  moyenne_jours: number;
  moyenne_heures: number;
  plus_rapide: number;
  plus_long: number;
}

export interface TopEmploye {
  employe: string;
  total: number;
  total_minutes: number;
}

export interface CalendrierAbsence {
  date: string;
  count: number;
  niveau: string;
}

export interface DemandeRecente {
  slug: string;
  employe: string;
  type: string;
  date_demande: string;
  debut: string;
  fin: string;
  duree: number;
  raison: string;
}

export interface RepartitionService {
  service: string;
  slug: string;
  total: number;
  approuvees: number;
  refusees: number;
  en_attente: number;
}

export interface ComparaisonPeriode {
  periode_actuelle: number;
  periode_precedente: number;
  evolution_pourcentage: number;
  evolution_nombre: number;
}

export interface RepartitionGenre {
  genre: string;
  genre_code: string;
  total: number;
  approuvees: number;
  refusees: number;
  en_attente: number;
  couleur: string;
}

export interface Alerte {
  type: string;
  message: string;
  count?: number;
  dates?: string[];
}

export interface DashboardData {
  kpis: KPIs;
  evolution: EvolutionData[];
  repartition_statuts: RepartitionStatut[];
  repartition_services: RepartitionService[];
  repartition_types: RepartitionType[];
  repartition_genres: RepartitionGenre[];
  temps_traitement: TempsTraitement;
  top_employes: TopEmploye[];
  calendrier_absences: CalendrierAbsence[];
  demandes_recentes: DemandeRecente[];
  comparaison_periode: ComparaisonPeriode;
  alertes: Alerte[];
  liste_employes: EmployeOption[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardData(filters?: DashboardFilters): Observable<DashboardData> {
    let params = new HttpParams();

    if (filters) {
      if (filters.periode) params = params.set('periode', filters.periode);
      if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
      if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
      if (filters.statut) params = params.set('statut', filters.statut);
      if (filters.type_id) params = params.set('type_id', filters.type_id);
      if (filters.employe_id) params = params.set('employe_id', filters.employe_id);
    }

    return this.http.get<DashboardData>(this.apiUrl, { params });
  }
}
