import { ApiResponse, PaginatedResponse } from './bureau.model';
import {
  ModePaiement,
  MODE_PAIEMENT_LABELS,
  MODE_PAIEMENT_ICONS,
} from './depense.model';

export type { ApiResponse, PaginatedResponse };
export type { ModePaiement };
export { MODE_PAIEMENT_LABELS, MODE_PAIEMENT_ICONS };

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
  // NOUVEAUX CHAMPS
  type_operation: TypeOperation | null;
  a_comptabiliser: boolean;
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
  // NOUVEAUX CHAMPS
  type_operation?: TypeOperation | null;
  a_comptabiliser?: boolean;
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
  // NOUVEAUX FILTRES
  type_operation?: TypeOperation;
  a_comptabiliser?: boolean;
}
