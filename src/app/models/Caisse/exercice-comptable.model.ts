export interface ExerciceComptable {
  rfk: string;
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: 'ouvert' | 'cloture';
  nb_ecritures?: number;
  total_debit?: number;
  total_credit?: number;
  resultat?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExerciceComptablePayload {
  libelle: string;
  date_debut: string;
  date_fin: string;
  statut: 'ouvert' | 'cloture';
}
