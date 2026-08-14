import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'mobile_money';

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
  { value: 'courant', label: 'Opération courante' },
  { value: 'interne_banque_caisse', label: 'Retrait banque → Caisse' },
  { value: 'interne_caisse_banque', label: 'Dépôt caisse → Banque' },
  { value: 'interne_banque_banque', label: 'Virement entre comptes bancaires' },
];

// Modèle principal
export interface Depense {
  rfk: string;
  type_depense_id: number;
  periode_id: number;
  exercice_id: number;
  bureau_id: number;
  utilisateur_id: number;
  compte_comptable_id: number;
  fournisseur_id: number | null;
  montant: number;
  mode_paiement: ModePaiement;
  reference_paiement: string | null;
  description: string;
  date_depense: string;
  // NOUVEAUX CHAMPS
  type_operation: TypeOperation | null;
  a_comptabiliser: boolean;
  // Relations eager-loaded
  type_depense?: { id: number; libelle: string };
  periode?: { id: number; libelle: string };
  exercice?: { id: number; annee: string };
  bureau?: { id: number; nom: string };
  compte_comptable?: { id: number; libelle: string };
  fournisseur?: { id: number; nom: string } | null;
  utilisateur?: { id: number; slug: string };
  created_at: string;
  updated_at: string;
}

// Payload
export interface DepensePayload {
  type_depense_id: number;
  periode_id: number;
  exercice_id: number;
  bureau_id: number;
  compte_comptable_id: number;
  fournisseur_id: number | null;
  montant: number;
  mode_paiement: ModePaiement | null;
  reference_paiement: string | null;
  description: string;
  date_depense: string;
  // NOUVEAUX CHAMPS
  type_operation?: TypeOperation | null;
  a_comptabiliser?: boolean;
}

// Filtres
export interface DepenseFilters {
  search?: string;
  bureau_id?: number;
  exercice_id?: number;
  periode_id?: number;
  type_depense_id?: number;
  fournisseur_id?: number;
  mode_paiement?: ModePaiement;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  per_page?: number;
  page?: number;
  // NOUVEAUX FILTRES
  type_operation?: TypeOperation;
  a_comptabiliser?: boolean;
}

// Labels modes paiement
export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  mobile_money: 'Mobile Money',
};

// icones
export const MODE_PAIEMENT_ICONS: Record<ModePaiement, string> = {
  especes: 'fa-money-bill-wave',
  cheque: 'fa-money-check',
  virement: 'fa-exchange-alt',
  mobile_money: 'fa-mobile-alt',
};
