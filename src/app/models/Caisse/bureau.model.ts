export interface BureauModel {
  rfk: string;
  code: string;
  libelle: string;
  rue?: string | null;
  codepostal?: string | null;
  ville: string;
  pays: string;
  complement?: string | null;
  nb_operation?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BureauModelPayload {
  libelle: string;
  rue?: string | null;
  codepostal?: string | null;
  ville: string;
  pays: string;
  complement?: string | null;
}

export interface BureauPreview {
  libelle: string;
  rue: string;
  complement: string;
  codepostal: string;
  ville: string;
  pays: string;
}

export interface BureauStats {
  total_bureaux: number;
  total_employes: number;
  operations_mois: number;
}
