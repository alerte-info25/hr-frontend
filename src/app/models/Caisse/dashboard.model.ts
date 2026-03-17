import {
  ModePaiement,
  MODE_PAIEMENT_LABELS,
  MODE_PAIEMENT_ICONS,
} from './depense.model';

export { MODE_PAIEMENT_LABELS, MODE_PAIEMENT_ICONS };
export type { ModePaiement };

//  Structure principale retournée par GET /caisse/dashboard

export interface DashboardData {
  exercice: ExerciceInfo;
  kpis: KpisDashboard;
  evolution_depenses: EvolutionMois[];
  evolution_recouvrements: EvolutionMois[];
  depenses_par_mode: OperationParMode[];
  recouvrements_par_mode: OperationParMode[];
  dernieres_depenses: DerniereDepense[];
  derniers_recouvrements: DernierRecouvrement[];
  types_depense: TypeDepenseStat[];
  services_propose: ServiceProposeStat[];
  bureaux: BureauStat[];
}

//  Exercice

export interface ExerciceInfo {
  id: number;
  rfk: string;
  annee: string;
  date_debut: string;
  date_fin: string;
}

//  KPIs

export interface KpisDashboard {
  total_depenses: number;
  total_recouvrements: number;
  solde: number;
  nb_depenses: number;
  nb_recouvrements: number;
  moyenne_depense: number;
  moyenne_recouvr: number;
  taux_couverture: number | null;
}

//  Évolution mensuelle

export interface EvolutionMois {
  mois: string; // "YYYY-MM"
  total: number;
  nombre: number;
}

//  Modes de paiement

export interface OperationParMode {
  mode_paiement: ModePaiement | null;
  total: number;
  nombre: number;
}

//  20 dernières opérations

export interface DerniereDepense {
  rfk: string;
  montant: number;
  date_depense: string;
  description: string | null;
  mode_paiement: ModePaiement | null;
  type_depense?: { id: number; libelle: string };
  periode?: { id: number; libelle: string };
  bureau?: { id: number; nom: string };
  fournisseur?: { id: number; nom: string } | null;
}

export interface DernierRecouvrement {
  rfk: string;
  montant: number;
  date_recouvrement: string;
  description: string | null;
  mode_paiement: ModePaiement | null;
  service_propose?: { id: number; nom: string };
  periode?: { id: number; libelle: string };
  bureau?: { id: number; nom: string };
  client?: { id: number; nom: string; prenom: string };
}

//  Stats par type de dépense

export interface TypeDepenseStat {
  id: number;
  libelle: string;
  nb_operations: number;
  total_montant: number;
}

//  Stats par service proposé

export interface ServiceProposeStat {
  id: number;
  nom: string;
  nb_operations: number;
  total_montant: number;
}

//  Stats par bureau

export interface BureauStat {
  id: number;
  nom: string;
  total_depenses: number;
  total_recouvrements: number;
  nb_depenses: number;
  nb_recouvrements: number;
  solde: number;
  moyenne_depense: number;
  moyenne_recouvr: number;
}

//  Évolution unifiée (calculé côté Angular)

export interface EvolutionUnifiee {
  mois: string;
  depenses: number;
  recouvrements: number;
  solde: number;
}
