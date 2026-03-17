export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string; 
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface BureauModel {
  id: number;
  rfk: string;
  nom: string;
  ville: string;
  pays: string;
  adresse?: string | null;
  complement?: string | null;
  codepostal?: string | null;
  // Compteurs injectés par withCount()
  depenses_count?: number;
  recouvrements_count?: number;
  utilisateurs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BureauPayload {
  nom: string;
  ville: string;
  pays: string;
  adresse?: string | null;
  complement?: string | null;
  codepostal?: string | null;
}

export interface BureauStats {
  bureau: string;
  total_depenses: number;
  total_recouvrements: number;
  solde: number;
}

export interface BureauFilters {
  search?: string;
  pays?: string;
  ville?: string;
  per_page?: number;
  page?: number;
}
