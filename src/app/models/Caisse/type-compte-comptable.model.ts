export interface TypeCompteComptableModel {
  rfk: string;
  code: string;
  libelle: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TypeCompteComptablePayload {
  code: string;
  libelle: string;
  description: string | null;
}
