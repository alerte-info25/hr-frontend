import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.developpement';

export interface DashboardFilters {
  periode?: 'jour' | 'semaine' | 'mois' | 'trimestre' | 'semestre' | 'annee' | 'personnalise';
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

export interface EvolutionCongeData {
  periode: string;
  total_demandes: number;
  total_jours: number;
  total_jours_bruts: string;
  total_formate: string;
  total_semaines: number;
  total: number;
  // Si l'API renvoie aussi ces données, ajoutez-les
  approuvees?: number;
  refusees?: number;
  en_attente?: number;
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

export interface RepartitionTypeConge {
  type_nom: string;
  type_slug: string;
  total_demandes: number;
  total_jours: number;
  // Ajoutez d'autres propriétés si nécessaire
}

export interface TempsTraitement {
  moyenne_jours: number;
  moyenne_heures: number;
  plus_rapide: number;
  plus_long: number;
}

export interface TopEmploye {
  employe: string;
  total: string;
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
  icon?: string;
}

export interface StatistiquesDurees {
  total: string;
  total_heures: number;
  moyenne: string;
  moyenne_heures: number;
  nombre_demandes: number;
  nombre_valide: number;
}

// CONGES
export interface AncienneteDetails {
  anciennete: number;
  anciennete_mois: number;
  date_debut: string | null;
  droits_acquis_total: number;
  droits_acquis: number;
  droits_en_semaines: number;
  droits_formate: string;
  jours_pris_avant_2026: number;
  jours_pris_2026: number;
  jours_pris: number;
  jours_pris_en_semaines: number;
  jours_pris_formate: string;
  jours_restants: number;
  jours_restants_en_semaines: number;
  jours_restants_formate: string;
  est_eligible: boolean;
  mois_restants_avant_eligibilite: number | null;
  jours_par_an: number;
  semaines_par_an: number;
}

export interface AncienneteIndicateurs {
  total_employes: number;
  sans_contrat: number;
  eligibles: number;
  proches_eligibilite: number;
  solde_critique: number;
  solde_negatif: number;
  taux_eligibilite: number;
  total_droits: number;
  total_droits_semaines: number;
  total_pris: number;
  total_pris_semaines: number;
  total_restants: number;
  total_restants_semaines: number;
  moyenne_droits: number;
  moyenne_pris: number;
  moyenne_restants: number;
  jours_par_semaine: number;
  jours_par_an: number;
  details?: AncienneteDetails;
}

export interface TopConge {
  employe: string;
  slug: string;
  total_jours: number;
  total_semaines: number;
  total_formate: string;
  nombre_conges: number;
  anciennete: number;
  solde_restant: number;
  solde_semaines: number;
}

export interface CongesParService {
  service_nom: string;
  service_slug: string;
  total_demandes: number;
  total_jours: number;
  total_semaines: number;
  total_formate: string;
  moyenne_jours: number;
  moyenne_semaines: number;
}

export interface StatistiquesConges {
  total_demandes: number;
  total_jours: number;
  total_semaines: number;
  total_formate: string;
  total_employes: number;
  moyenne_jours_par_demande: number;
  moyenne_jours_par_employe: number;
  moyenne_semaines_par_employe: number;
}


export interface ReponseDemande {
  slug: string;
  id_demande: string;
  id_employe: string;
  reponse: string;
  created_at: string;
  updated_at: string;
  employe?: EmployeOption;
  demande?: DemandeExplication;
  pieces?: PieceReponse[];
  sanction?: Sanction;
}

export interface PieceReponse {
  slug: string;
  reponse_id: string;
  chemin: string;
  nom_fichier: string;
  extension: string;
  taille: number;
  created_at: string;
}

export interface DemandeExplication {
  slug: string;
  id_employe: string;
  id_objet: string;
  description: string;
  statut: 1 | 2; // 1 = en attente, 2 = répondu
  created_at: string;
  updated_at: string;
  employe_nom: string;
  employe?: EmployeOption;
  objet_libelle: string;
  objet?: Objet;
  date_demande: string;
  delai_jours: number;
  est_urgent: boolean;
  statut_label: string;
  statut_couleur: string;
  a_repondu: boolean;
  a_sanction: boolean;
  reponse?: ReponseDemande;
  sanction?: Sanction;
}

export interface Objet {
  slug: string;
  libelle: string;
}

export interface StatistiquesDemandesExplications {
  total: number;
  en_attente: number;   // statut = 1
  repondues: number;     // statut = 2
  sanctionnees: number;  // avec sanction (indépendant du statut)
  urgentes: number;      // en attente depuis > 5 jours
  delai_moyen_jours: number;
  delai_max_jours: number;
  taux_reponse: number;
  taux_sanction: number;
}

export interface EvolutionExplication {
  periode: string;
  total: number;
  en_attente: number;
  repondues: number;
  sanctionnees: number;
}

export interface RepartitionExplicationObjet {
  objet: string;
  objet_slug: string;
  total: number;
  en_attente: number;
  repondues: number;
  sanctionnees: number;
}

export interface RepartitionExplicationStatut {
  statut: string;       // "En attente" ou "Répondu"
  statut_code: 1 | 2;
  total: number;
  couleur: string;
}

// ============================================
// SANCTIONS
// ============================================

export interface Sanction {
  slug: string;
  id_employe: string;
  id_demande?: string | null;
  id_reponse?: string | null;
  id_decideur: string;
  type: 'avertissement' | 'blame' | 'suspension' | 'licenciement' | string;
  type_label: string;
  type_couleur: string;
  motif: string;
  date_sanction: string;
  date_sanction_formatee: string;
  employe_nom: string;
  employe?: EmployeOption;
  a_demande: boolean;
  a_reponse: boolean;
  demande?: DemandeExplication;
  reponse?: ReponseDemande;
}

export interface StatistiquesSanctions {
  total: number;
  par_type: {
    avertissement: number;
    blame: number;
    suspension: number;
    licenciement: number;
  };
  avec_demande: number;
  sans_demande: number;
  par_mois: Array<{ mois: string; total: number }>;
  taux_sanction_global: number;
  taux_avertissement: number;
  taux_blame: number;
  taux_suspension: number;
  taux_licenciement: number;
}

export interface TopEmployeSanction {
  employe: string;
  slug: string;
  total_sanctions: number;
  par_type: {
    avertissement: number;
    blame: number;
    suspension: number;
    licenciement: number;
  };
}

export interface EvolutionSanction {
  periode: string;
  total: number;
  avertissement: number;
  blame: number;
  suspension: number;
  licenciement: number;
  avec_demande: number;
}

export interface RepartitionSanctionType {
  type: string;
  type_label: string;
  total: number;
  couleur: string;
}

// DOnnées RH
export interface EmployesKPIs {
  total: number;
  hommes: number;
  femmes: number;
  moins_30_ans: number;
  cdd: number;
  cdi: number;
  stage: number;
  sans_contrat: number;
  interim: number;
  freelance: number;
  total_conges_droits: number;
  total_conges_pris: number;
  total_conges_restants: number;
  taux_hommes: number;
  taux_femmes: number;
}

export interface EmployeParService {
  service: string;
  total: number;
}

export interface EmployeParTypeContrat {
  type: string;
  total: number;
  couleur: string;
}

export interface EmployeParTrancheAge {
  tranche: string;
  total: number;
  couleur: string;
}

export interface DernierEmploye {
  slug: string;
  nom_complet: string;
  service: string;
  fonction: string;
  date_embauche: string;
}

export interface StatistiquesAnciennete {
  moyenne_ans: number;
  total_employes: number;
  repartition: {
    moins_1_an: number;
    '1-3_ans': number;
    '3-5_ans': number;
    '5-10_ans': number;
    plus_10_ans: number;
  };
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
  statistiques_durees: StatistiquesDurees;

  anciennete: AncienneteIndicateurs;
  alertes_conges: Alerte[];
  top_conges: TopConge[];
  conges_par_service: CongesParService[];
  statistiques_conges: StatistiquesConges;
  evolution_conges: EvolutionCongeData[];
  repartition_par_type_conge: RepartitionTypeConge[];

  demandes_explications: DemandeExplication[];
  demandes_explications_urgentes: DemandeExplication[];
  statistiques_explications: StatistiquesDemandesExplications;
  evolution_explications: EvolutionExplication[];
  repartition_explications_par_objet: RepartitionExplicationObjet[];
  repartition_explications_par_statut: RepartitionExplicationStatut[];

  // Sanctions
  sanctions: Sanction[];
  statistiques_sanctions: StatistiquesSanctions;
  top_employes_sanctions: TopEmployeSanction[];
  evolution_sanctions: EvolutionSanction[];
  repartition_sanctions_par_type: RepartitionSanctionType[];

  // RH
  employes_kpis: EmployesKPIs;
  employes_par_service: EmployeParService[];
  employes_par_type_contrat: EmployeParTypeContrat[];
  employes_par_tranche_age: EmployeParTrancheAge[];
  derniers_employes: DernierEmploye[];
  statistiques_anciennete: StatistiquesAnciennete;
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
