import { ApiResponse, PaginatedResponse } from './bureau.model';

export type { ApiResponse, PaginatedResponse };

export interface Client {
  rfk: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
  // Compteur injecté via withCount()
  recouvrements_count?: number;
  recouvrements_sum_montant?: number;
  created_at: string;
  updated_at: string;
}

export interface ClientPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse: string;
}

export interface ClientFilters {
  search?: string;
  per_page?: number;
  page?: number;
}
