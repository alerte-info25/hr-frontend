import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export type ModePaiement = 'especes' | 'cheque' | 'virement' | 'mobile_money';

//  Modèle principal
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

//  Payload
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
}

//  Filtres
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
}

//  Labels modes paiement
export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  cheque: 'Chèque',
  virement: 'Virement',
  mobile_money: 'Mobile Money',
};

// mes icones
export const MODE_PAIEMENT_ICONS: Record<ModePaiement, string> = {
  especes: 'fa-money-bill-wave',
  cheque: 'fa-money-check',
  virement: 'fa-exchange-alt',
  mobile_money: 'fa-mobile-alt',
};
