import { ModePaiement } from './depense.model';

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BureauModel {
  id: number;
  rfk: string;
  nom: string;
  ville: string;
  pays: string;
  adresse?: string | null;
  complement?: string | null;
  codepostal?: string | null;
  depenses_count?: number;
  recouvrements_count?: number;
  utilisateurs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BureauPayload {
  nom: string;
  ville: string;
  pays: string;
  adresse?: string | null;
  complement?: string | null;
  codepostal?: string | null;
}

export interface BureauStats {
  bureau: string;
  total_depenses: number;
  total_recouvrements: number;
  solde: number;
}

export interface BureauFilters {
  search?: string;
  pays?: string;
  ville?: string;
  per_page?: number;
  page?: number;
}

// NOUVEAU : Types d'opérations
export type TypeOperation =
  | 'courant'
  | 'interne_banque_caisse'
  | 'interne_caisse_banque'
  | 'interne_banque_banque';

export const TYPE_OPERATION_LABELS: Record<TypeOperation, string> = {
  courant: 'Opération courante',
  interne_banque_caisse: 'Retrait banque → Caisse',
  interne_caisse_banque: 'Dépôt caisse → Banque',
  interne_banque_banque: 'Virement entre comptes bancaires',
};

export const TYPE_OPERATION_OPTIONS = [
  { value: '', label: 'Tous les types' },
  { value: 'courant', label: 'Opération courante' },
  { value: 'interne_banque_caisse', label: 'Retrait banque → Caisse' },
  { value: 'interne_caisse_banque', label: 'Dépôt caisse → Banque' },
  { value: 'interne_banque_banque', label: 'Virement entre comptes bancaires' },
];

export const COMPTABILISATION_OPTIONS = [
  { value: '', label: 'Toutes les opérations' },
  { value: 'true', label: 'Comptabilisées uniquement' },
  { value: 'false', label: 'Non comptabilisées uniquement' },
];

// Opération unifiée
export interface BureauOperation {
  rfk: string;
  date: string;
  libelle: string | null;
  reference: string | null;
  type: 'entree' | 'sortie';
  montant: number;
  mode_paiement: ModePaiement | null;
  // NOUVEAUX CHAMPS
  a_comptabiliser: boolean;
  type_operation: TypeOperation | null;
  // Spécifiques selon le type
  type_depense?: string | null;
  service?: string | null;
  periode?: string | null;
  exercice?: string | null;
  compte?: string | null;
  tiers?: string | null;
}

export interface BureauDetailData {
  bureau: {
    rfk: string;
    nom: string;
    adresse?: string | null;
    ville: string;
    pays: string;
    codepostal?: string | null;
    complement?: string | null;
  };
  totaux: {
    total_entrees: number;
    total_sorties: number;
    solde: number;
    nb_operations: number;
  };
  operations: PaginatedResponse<BureauOperation>;
}

export interface BureauOperationsFilters {
  exercice_id?: number;
  periode_id?: number;
  type?: 'entree' | 'sortie';
  search?: string;
  per_page?: number;
  page?: number;
  // NOUVEAUX FILTRES
  type_operation?: TypeOperation;
  a_comptabiliser?: boolean;
}
