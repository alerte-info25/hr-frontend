import { ApiResponse, PaginatedResponse } from './bureau.model';
import { ExerciceModel } from './exercice-comptable.model';

export type { ApiResponse, PaginatedResponse };

export type TypePeriode = 'mensuel' | 'trimestriel' | 'semestriel' | 'annuel';

export interface Periode {
  id: number;
  rfk: string;
  exercice_id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  type: TypePeriode;
  est_cloturee: boolean;
  exercice?: Pick<ExerciceModel, 'rfk' | 'annee'>;
  // Compteurs via withCount()
  depenses_count?: number;
  recouvrements_count?: number;
  created_at: string;
  updated_at: string;
}

export interface GenererPeriodesPayload {
  exercice_rfk: string;
  type: TypePeriode;
}

export interface PeriodeFilters {
  search?: string;
  exercice_rfk?: string;
  type?: TypePeriode;
  est_cloturee?: boolean;
  per_page?: number;
  page?: number;
}

export const TYPE_PERIODE_LABELS: Record<TypePeriode, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  semestriel: 'Semestriel',
  annuel: 'Annuel',
};
