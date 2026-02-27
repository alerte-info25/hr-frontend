export interface CategorieComptableModel {
  rfk: string;
  code: string;
  libelle: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface CategorieComptablePayload {
  code: string;
  libelle: string;
  description: string | null;
}
