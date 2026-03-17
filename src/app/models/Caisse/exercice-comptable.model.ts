import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

//  Modèle principal
export interface ExerciceModel {
  id: number;
  rfk: string;
  libelle: string;
  annee: string;
  date_debut: string;
  date_fin: string;
  est_actif: boolean;
  est_cloture: boolean;
  // Compteurs injectés via withCount()
  periodes_count?: number;
  depenses_count?: number;
  recouvrements_count?: number;
  // Relation eager-loaded (show uniquement)
  periodes?: PeriodeRef[];
  created_at?: string;
  updated_at?: string;
}

//  Période 
export interface PeriodeRef {
  id: number;
  rfk: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  type: TypePeriode;
  est_cloturee: boolean;
}

export type TypePeriode = 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';

//  Payload création
export interface ExercicePayload {
  libelle: string;
  annee: string;
  date_debut: string;
  date_fin: string;
  est_actif?: boolean;
}

//  Filtres
export interface ExerciceFilters {
  search?: string;
  est_actif?: boolean;
  est_cloture?: boolean;
  per_page?: number;
  page?: number;
}

//  Stats détail (endpoint /stats)
/** Référence minimale d'une entité liée */
interface RfkLabel {
  rfk: string;
  libelle: string;
}

interface RfkNom {
  rfk: string;
  nom: string;
}

/** Dépense telle que retournée dans les stats de l'exercice */
export interface DepenseItem {
  rfk: string;
  date_depense: string;
  description: string;
  montant: number;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  reference_paiement: string | null;
  type_depense: RfkLabel | null;
  periode: RfkLabel | null;
  fournisseur: RfkNom | null;
  compte_comptable: RfkLabel | null;
  bureau: RfkNom | null;
}

/** Recouvrement tel que retourné dans les stats de l'exercice */
export interface RecouvrementItem {
  rfk: string;
  date_recouvrement: string;
  description: string;
  montant: number;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  reference_paiement: string | null;
  service_propose: RfkNom | null;
  periode: RfkLabel | null;
  client: { rfk: string; nom: string; prenom: string } | null;
  compte_comptable: RfkLabel | null;
  bureau: RfkNom | null;
}

/** Période enrichie avec ses totaux financiers */
export interface PeriodeStats {
  rfk: string;
  libelle: string;
  type: TypePeriode;
  date_debut: string;
  date_fin: string;
  est_cloturee: boolean;
  nb_depenses: number;
  nb_recouvrements: number;
  total_depenses: number;
  total_recouvrements: number;
}

/** Réponse complète de GET /exercices/:rfk/stats */
export interface ExerciceStats {
  exercice: ExerciceModel;
  nb_periodes: number;
  nb_depenses: number;
  nb_recouvrements: number;
  total_depenses: number;
  total_recouvrements: number;
  solde: number;
  evolution_depenses: number; 
  evolution_recouvrements: number;
  periodes: PeriodeStats[];
  depenses: DepenseItem[];
  recouvrements: RecouvrementItem[];
}
