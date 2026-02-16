import { AttributionPrime } from "./attribution-prime.model";
import { Employe } from "./employe.model";

export interface Projet {
  id: number;
  nom: string;
  description?: string;
  montant_total: number;
  prime_totale: number;
  date_debut?: string;
  date_fin?: string;
  statut: 'en_cours' | 'termine' | 'annule';
  slug?: string;
  employes?: Employe[];
  attribution_primes?: AttributionPrime[];
  created_at?: string;
  updated_at?: string;
}
