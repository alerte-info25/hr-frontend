import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export interface TypeDepense {
  id: number;
  rfk: string;
  libelle: string;
  description: string | null;
  depenses_count?: number;
  depenses_sum_montant?: number | string | null;
  reference_paiement?: string | null;
  created_at?: string;
  updated_at?: string;
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
