import { ApiResponse, PaginatedResponse } from './bureau.model';

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