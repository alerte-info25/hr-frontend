import { Employe, Service } from "./employe.model";
import { Paiement } from "./paiement.model";
import { Projet } from "./projet.model";

export interface AttributionPrime {
  id?: number;
  projet_id: number;
  employe_slug: string;
  pourcentage_prime: number;
  montant_prime: number;
  montant_paye: number;
  montant_restant: number;
  statut: 'en_attente' | 'partiel' | 'complete';
  slug?: string;
  employe?: Employe;
  projet?: Projet;
  paiements?: Paiement[];
  created_at?: string;
  updated_at?: string;
}

export interface Dashboard {
  total_projets: number;
  projets_en_cours: number;
  projets_termines: number;
  total_primes_attribuees: number;
  total_primes_payees: number;
  total_primes_restantes: number;
  nombre_developpeurs: number;
  derniers_paiements: Paiement[];
}

export interface RapportDeveloppeur {
  employe: Employe;
  service: Service;
  total_primes_attribuees: number;
  total_paye: number;
  total_restant: number;
  nombre_projets: number;
  projets: AttributionPrime[];
}

export interface RapportProjet {
  projet: Projet;
  total_prime: number;
  total_paye: number;
  total_restant: number;
  pourcentage_paiement: number;
  toutes_primes_payees: boolean;
  nombre_developpeurs: number;
  attributions: AttributionPrime[];
}
