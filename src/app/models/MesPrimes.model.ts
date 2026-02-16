export interface Statistiques {
  total_primes_attribuees: number;
  total_paye: number;
  total_restant: number;
  pourcentage_paye: number;
  nombre_projets: number;
  nombre_projets_en_cours: number;
  nombre_projets_termines: number;
}

export interface Projet {
  projet: any;
  attribution: any;
  paiements: any[];
  nombre_paiements: number;
}

export interface MesPrimesData {
  developpeur: any;
  statistiques: Statistiques;
  projets: Projet[];
  historique_paiements: any[];
  repartition_par_statut: any;
  paiements_par_mode: any[];
  evolution_paiements: any[];
  paiements_attendus: any[];
}
