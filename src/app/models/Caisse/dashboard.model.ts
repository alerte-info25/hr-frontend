import {
  ModePaiement,
  MODE_PAIEMENT_LABELS,
  MODE_PAIEMENT_ICONS,
} from './depense.model';

export { MODE_PAIEMENT_LABELS, MODE_PAIEMENT_ICONS };
export type { ModePaiement };

// Types d'opérations
export type TypeOperation =
  | 'courant'
  | 'interne_banque_caisse'
  | 'interne_caisse_banque'
  | 'interne_banque_banque';

export const TYPE_OPERATION_LABELS: Record<TypeOperation, string> = {
  courant: 'Opération courante',
  interne_banque_caisse: 'Retrait banque - Caisse',
  interne_caisse_banque: 'Dépôt caisse - Banque',
  interne_banque_banque: 'Virement entre comptes bancaires',
};

export const TYPE_OPERATION_COLORS: Record<TypeOperation, string> = {
  courant: '#10B981', // Vert
  interne_banque_caisse: '#F59E0B', // Orange
  interne_caisse_banque: '#8B5CF6', // Violet
  interne_banque_banque: '#3B82F6', // Bleu
};

// Structure pour les opérations non comptabilisées
export interface NonComptabilises {
  depenses: number;
  recouvrements: number;
  total: number;
}

// Structure principale retournée par GET /caisse/dashboard
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

// KPIs - AJOUT des non comptabilisés
export interface KpisDashboard {
  total_depenses: number;
  total_recouvrements: number;
  solde: number;
  nb_depenses: number;
  nb_recouvrements: number;
  moyenne_depense: number;
  moyenne_recouvr: number;
  taux_couverture: number | null;
  non_comptabilises: NonComptabilises; // NOUVEAU
}

// Exercice
export interface ExerciceInfo {
  id: number;
  rfk: string;
  annee: string;
  date_debut: string;
  date_fin: string;
}

// Évolution mensuelle
export interface EvolutionMois {
  mois: string; // "YYYY-MM"
  total: number;
  nombre: number;
}

// Modes de paiement
export interface OperationParMode {
  mode_paiement: ModePaiement | null;
  total: number;
  nombre: number;
}

// Dernière dépense avec champs de comptabilisation
export interface DerniereDepense {
  rfk: string;
  montant: number;
  date_depense: string;
  description: string | null;
  mode_paiement: ModePaiement | null;
  a_comptabiliser: boolean; // NOUVEAU
  type_operation: TypeOperation | null; // NOUVEAU
  type_depense?: { id: number; libelle: string };
  periode?: { id: number; libelle: string };
  bureau?: { id: number; nom: string };
  fournisseur?: { id: number; nom: string } | null;
}

// Dernier recouvrement avec champs de comptabilisation
export interface DernierRecouvrement {
  rfk: string;
  montant: number;
  date_recouvrement: string;
  description: string | null;
  mode_paiement: ModePaiement | null;
  a_comptabiliser: boolean; // NOUVEAU
  type_operation: TypeOperation | null; // NOUVEAU
  service_propose?: { id: number; nom: string };
  periode?: { id: number; libelle: string };
  bureau?: { id: number; nom: string };
  client?: { id: number; nom: string; prenom: string };
}

// Stats par type de dépense
export interface TypeDepenseStat {
  id: number;
  libelle: string;
  nb_operations: number;
  total_montant: number;
}

// Stats par service proposé
export interface ServiceProposeStat {
  id: number;
  nom: string;
  nb_operations: number;
  total_montant: number;
}

// Stats par bureau
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

// Évolution unifiée (calculé côté Angular)
export interface EvolutionUnifiee {
  mois: string;
  depenses: number;
  recouvrements: number;
  solde: number;
}

// Filtres pour le dashboard
export interface DashboardFilters {
  exercice_rfk?: string;
  type_operation?: TypeOperation;
  a_comptabiliser?: boolean;
}
