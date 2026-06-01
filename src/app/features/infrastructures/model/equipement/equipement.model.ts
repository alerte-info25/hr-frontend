export interface Equipement {
  slug?: string;
  code_interne: string;
  designation: string;

  categorie_slug?: string;
  zone_slug?: string;
  bureau_slug?: string;

  marque?: string;
  modele?: string;
  numero_serie?: string;

  configuration?: string;

  etat: 'neuf' | 'bon_etat' | 'usage' | 'en_panne' | 'en_maintenance' | 'reforme';

  date_garantie_fin?: string;
  notes?: string;
}
