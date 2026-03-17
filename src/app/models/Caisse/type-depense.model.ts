import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export interface TypeDepense {
  rfk: string;
  libelle: string;
  description: string;
  depenses_count?: number;
  depenses_sum_montant?: number;
  created_at: string;
  updated_at: string;
}

export interface TypeDepensePayload {
  libelle: string;
  description?: string;
}

export interface TypeDepenseFilters {
  search?: string;
  per_page?: number;
  page?: number;
}
