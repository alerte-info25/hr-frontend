export interface CompteComptableRelation {
  rfk: string;
  code: string;
  libelle: string;
  description: string;
}

export interface CompteComptableModel {
  rfk: string;
  numero: string;
  libelle: string;
  actif: boolean;
  classe_comptable: CompteComptableRelation | null;
  type_compte_comptable: CompteComptableRelation | null;
  categorie_comptable: CompteComptableRelation | null;
  description: string;
  nb_operations?: number;
  total_debit?: number; 
  total_credit?: number; 
  solde?: number;
  created_at: string;
  updated_at: string;
}

export interface CompteComptablePayload {
  numero: string;
  libelle: string;
  classe_comptable_rfk: string;
  type_compte_comptable_rfk: string;
  categorie_comptable_rfk: string;
  description: string;
  actif?: boolean;
}

export interface SoldeCompte {
  compte_rfk: string;
  total_debit: number;
  total_credit: number;
  solde: number;
  nb_operations: number;
}

export interface CompteActif {
  rfk: string;
  numero: string;
  libelle: string;
  nb_operations: number;
}
