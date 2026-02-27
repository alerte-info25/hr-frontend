export interface LigneOperationRef {
  rfk: string;
  compte: { rfk: string; numero: string; libelle: string } | null;
  montant_debit: number;
  montant_credit: number;
  libelle: string | null;
  images: string[] | null;
}

export interface OperationComptable {
  rfk: string;
  numero: string;
  date_operation: string;
  libelle: string;
  statut: 'brouillon' | 'validee' | 'annulee';
  user: {
    rfk: string | null;
    employe: { nom: string; prenom: string } | null;
  } | null;

  employe: {
    rfk: string | null;
    employe: { nom: string; prenom: string } | null;
  } | null;
  bureau: { rfk: string; libelle: string } | null;
  service: { rfk: string; libelle: string } | null;
  nature_operation: { rfk: string; libelle: string; code: string } | null;
  exercice_comptable: { rfk: string; libelle: string } | null;
  lignes: LigneOperationRef[];
  created_at: string;
  updated_at: string;
}

export interface LignePayload {
  compte_comptable_rfk: string;
  montant_debit?: number;
  montant_credit?: number;
  libelle?: string | null;
  images?: string[] | null;
}

export interface OperationComptablePayload {
  date_operation: string;
  libelle: string;
  bureau_rfk: string;
  service_rfk: string;
  nature_operation_comptable_rfk: string;
  exercice_comptable_rfk: string;
  employe_rfk?: string | null;
  lignes: LignePayload[];
}
