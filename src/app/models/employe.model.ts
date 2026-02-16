export interface Employe {
  id?: number;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  slug: string;
  photo?: string;
  photo_url?: string;
  service?: Service;
  nom_complet?: string;
}

export interface Service {
  id?: number;
  nom: string;
  description?: string;
  slug: string;
}
