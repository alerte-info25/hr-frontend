export interface ClasseComptableModel {
  rfk: string;
  code: string;
  libelle: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClasseComptablePayload {
  code: string;
  libelle: string;
  description: string;
}
