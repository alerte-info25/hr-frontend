import { ModePaiement } from "./depense.model";

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

// Opération unifiée
export interface BureauOperation {
  rfk: string;
  date: string;
  libelle: string | null;
  reference: string | null;
  type: 'entree' | 'sortie';
  montant: number;
  mode_paiement: ModePaiement | null;
  // Spécifiques selon le type
  type_depense?: string | null;   // pour sortie
  service?: string | null;        // pour entrée
  periode?: string | null;
  exercice?: string | null;
  compte?: string | null;
  tiers?: string | null;          // fournisseur ou client
}

export interface BureauDetailData {
  bureau: {
    rfk: string;
    nom: string;
    adresse?: string | null;
    ville: string;
    pays: string;
    codepostal?: string | null;
    complement?: string | null;
  };
  totaux: {
    total_entrees: number;
    total_sorties: number;
    solde: number;
    nb_operations: number;
  };
  operations: PaginatedResponse<BureauOperation>;
}

export interface BureauOperationsFilters {
  exercice_id?: number;
  periode_id?: number;
  type?: 'entree' | 'sortie';
  search?: string;
  per_page?: number;
  page?: number;
}