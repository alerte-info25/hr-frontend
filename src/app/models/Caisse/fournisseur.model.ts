import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export interface Fournisseur {
  rfk: string;
  nom: string;
  contact: string;     
  email: string;
  telephone: string;
  adresse: string;
  // Compteur injecté via withCount()
  depenses_count?: number;
  depenses_sum_montant?: number;
  created_at: string;
  updated_at: string;
}

export interface FournisseurPayload {
  nom: string;
  contact: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface FournisseurFilters {
  search?: string;
  per_page?: number;
  page?: number;
}