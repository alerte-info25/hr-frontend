// src/app/models/permission.model.ts
export interface PermissionDocument {
  slug: string;
  nom_fichier: string;
  extension: string;
  chemin: string;
  url?: string;
  taille: number;
  type: 'pdf' | 'image';
}

export interface Permission {
  id?: number;
  slug: string;
  date_demande: string;
  debut: string;
  fin: string;
  statut: 1 | 2 | 3;
  raison: string;
  date_reponse?: string;
  commentaire_admin?: string;
  id_type: string;
  id_employe: string;

  /** ⬇️ NOUVEAU — calculé côté backend */
  duree_minutes: number;
  duree_formatee?: string; // optionnel, renvoyé par le backend

  documents: PermissionDocument[];
  type?: { nom: string; slug: string };
  employe?: any;
}

/** Réponse de l'endpoint de prévisualisation */
export interface DureePreview {
  duree_minutes: number;
  duree_formatee: string;
  detail_par_jour: {
    date: string;
    jour_semaine: string;
    minutes: number;
    est_permanence: boolean;
    source: 'horaire_normal' | 'permanence' | 'ignore'; // ignore = weekend non travaillé
  }[];
  avertissements?: string[]; // ex: "Samedi non planifié en permanence, ignoré"
}
