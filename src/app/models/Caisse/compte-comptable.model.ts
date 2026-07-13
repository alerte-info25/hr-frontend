import { ApiResponse, PaginatedResponse } from './bureau.model';
import { ModePaiement } from './depense.model';

export type { ApiResponse, PaginatedResponse };

//  Modèle principal
export interface CompteComptable {
  rfk: string;
  libelle: string;
  description: string;
  est_actif: boolean;
  // Compteurs via withCount()
  depenses_count?: number;
  recouvrements_count?: number;
  created_at: string;
  updated_at: string;
}

//  Payload
export interface CompteComptablePayload {
  libelle: string;
  description: string;
  est_actif: boolean;
}

//  Filtres
export interface CompteComptableFilters {
  search?: string;
  est_actif?: boolean;
  per_page?: number;
  page?: number;
}

// compte-comptable.model.ts (extrait)

export interface CompteStats {
  compte: string;
  total_depenses: number;
  total_recouvrements: number;
  solde: number;
}

// Structure d'une opération unifiée (identique à BureauOperation)
export interface CompteOperation {
  rfk: string;
  date: string;
  libelle: string | null;
  reference: string | null;
  type: 'entree' | 'sortie';
  montant: number;
  mode_paiement: ModePaiement | null;
  type_depense?: string | null; // pour sortie
  service?: string | null; // pour entrée
  periode?: string | null;
  exercice?: string | null;
  compte?: string | null;
  tiers?: string | null;
}

export interface CompteOperationsData {
  compte: {
    rfk: string;
    libelle: string;
    description: string;
    est_actif: boolean;
  };
  totaux: {
    total_entrees: number;
    total_sorties: number;
    solde: number;
    nb_operations: number;
  };
  operations: PaginatedResponse<CompteOperation>;
}
