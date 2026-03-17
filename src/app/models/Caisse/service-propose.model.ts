import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export interface ServicePropose {
  rfk: string;
  nom: string;
  description: string;
  // Compteur injecté via withCount()
  recouvrements_count?: number;
  recouvrements_sum_montant?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceProposePayload {
  nom: string;
  description: string;
}

export interface ServiceProposeFilters {
  search?: string;
  per_page?: number;
  page?: number;
}
