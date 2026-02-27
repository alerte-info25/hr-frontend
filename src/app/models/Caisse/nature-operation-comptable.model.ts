export interface NatureOperationComptable {
  rfk: string;
  code: string;
  libelle: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface NatureOperationComptablePayload {
  code: string;
  libelle: string;
  description?: string | null;
}
