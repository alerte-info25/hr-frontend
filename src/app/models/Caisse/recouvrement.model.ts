import { ApiResponse, PaginatedResponse } from './bureau.model';
import {
  ModePaiement,
  MODE_PAIEMENT_LABELS,
  MODE_PAIEMENT_ICONS,
} from './depense.model';

export type { ApiResponse, PaginatedResponse };
export type { ModePaiement };
export { MODE_PAIEMENT_LABELS, MODE_PAIEMENT_ICONS };

//  Modèle principal
export interface Recouvrement {
  rfk: string;
  service_propose_id: number;
  periode_id: number;
  exercice_id: number;
  bureau_id: number;
  utilisateur_id: number;
  compte_comptable_id: number;
  client_id: number;
  montant: number;
  mode_paiement: ModePaiement;
  reference_paiement: string | null;
  description: string | null;
  date_recouvrement: string;
  // Relations eager-loaded
  service_propose?: { id: number; nom: string };
  periode?: { id: number; libelle: string };
  exercice?: { id: number; annee: string };
  bureau?: { id: number; nom: string };
  compte_comptable?: { id: number; libelle: string };
  client?: { id: number; nom: string; prenom: string };
  utilisateur?: { id: number; slug: string };
  created_at: string;
  updated_at: string;
}

//  Payload
export interface RecouvrementPayload {
  service_propose_id: number;
  periode_id: number;
  exercice_id: number;
  bureau_id: number;
  compte_comptable_id: number;
  client_id: number;
  montant: number;
  mode_paiement: ModePaiement;
  reference_paiement: string | null;
  description: string | null;
  date_recouvrement: string;
}

//  Filtres
export interface RecouvrementFilters {
  search?: string;
  bureau_id?: number;
  exercice_id?: number;
  periode_id?: number;
  client_id?: number;
  service_propose_id?: number;
  mode_paiement?: ModePaiement;
  date_debut?: string;
  date_fin?: string;
  montant_min?: number;
  montant_max?: number;
  per_page?: number;
  page?: number;
}
