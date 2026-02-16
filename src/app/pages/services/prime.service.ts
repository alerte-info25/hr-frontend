import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RapportDeveloppeur, RapportProjet } from '../../models/attribution-prime.model';
import { environment } from '../../../environments/environment.developpement';
import { Employe } from '../../models/employe.model';
// import { MesPrimesData} from from '../prime-developpeur/prime-developpeur.component';
import { MesPrimesData } from '../../models/MesPrimes.model';
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface Projet {
  id: number;
  slug: string;
  nom: string;
  description?: string;
  montant_total: number;
  prime_totale: number;
  date_debut?: string;
  date_fin?: string;
  statut: 'en_attente' | 'en_cours' | 'termine';
  created_at: string;
  updated_at: string;
}

export interface Attribution {
  id: number;
  slug: string;
  projet_id: number;
  employe_slug: string;
  pourcentage_prime: number;
  montant_prime: number;
  montant_paye: number;
  montant_restant: number;
  statut: 'en_attente' | 'partiel' | 'paye';
  employe?: any;
  paiements?: Paiement[];
}

export interface Paiement {
  id: number;
  slug: string;
  attribution_prime_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'virement' | 'cheque' | 'mobile_money';
  reference?: string;
  commentaire?: string;
  created_at: string;
}

export interface Dashboard {
  data: Dashboard | null;
  success: any;
  total_primes_attribuees: number;
  total_primes_payees: number;
  total_primes_restantes: number;
  pourcentage_global_paiement: number;
  projets: {
    total: number;
    en_cours: number;
    termines: number;
    annules: number;
    avec_paiements: number;
    termines_paiement: number;
  };
  top_projets: any[];
  developpeurs: any;
  top_developpeurs: any[];
  derniers_paiements: any[];
  paiements_par_mode: any[];
  evolution_paiements: any[];
}

@Injectable({
  providedIn: 'root'
})
export class PrimeService {

  constructor(private http: HttpClient) {}

  // ==================== DASHBOARD ====================

  getDashboard(): Observable<Dashboard> {
    return this.http.get<ApiResponse<Dashboard>>(`${environment.apiUrl}prime/dashboard`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getProjets(): Observable<any[]> {
    return this.http.get<Projet[]>(`${environment.apiUrl}prime/projets`)
      .pipe(catchError(this.handleError));
  }

  getMesPrimes(slug: string): Observable<MesPrimesData> {
    return this.http
      .get<{ success: boolean; data: MesPrimesData }>(
        `${environment.apiUrl}prime/mes-primes/${slug}`
      )
      .pipe(
        map(response => response.data)
      );
  }



  getProjet(id: number): Observable<RapportProjet> {
    return this.http.get<ApiResponse<RapportProjet>>(`${environment.apiUrl}prime/projets/${id}`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateStatut(slug:string, data: any){
    return this.http.post<any>(`${environment.apiUrl}prime/projets-statut/${slug}`,data)
  }

  deletePaiement(slug:string){
    return this.http.delete<any>(`${environment.apiUrl}prime/paiement-delete/${slug}`)
  }

  creerProjet(data: {
    nom: string;
    description?: string;
    montant_total: number;
    prime_totale: number;
    date_debut?: string;
    date_fin?: string;
    employes: Array<{ employe_slug: string; pourcentage: number }>;
  }): Observable<Projet> {
    return this.http.post<ApiResponse<Projet>>(`${environment.apiUrl}prime/projets`, data)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  updateProjet(id: number, data: Partial<Projet>): Observable<Projet> {
    return this.http.put<ApiResponse<Projet>>(`${environment.apiUrl}prime/projets/${id}`, data)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  deleteProjet(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}prime/projets/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ==================== DÉVELOPPEURS ====================

  getDeveloppeurs(): Observable<Employe[]> {
    return this.http.get<ApiResponse<Employe[]>>(`${environment.apiUrl}prime/developpeurs`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  getRapportDeveloppeur(slug: string): Observable<RapportDeveloppeur> {
    return this.http.get<ApiResponse<RapportDeveloppeur>>(`${environment.apiUrl}prime/developpeurs/${slug}/rapport`)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // ==================== PAIEMENTS ====================

  getPaiements(page: number = 1): Observable<{ data: Paiement[]; total: number }> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}prime/paiements?page=${page}`)
      .pipe(
        map(response => ({
          data: response.data.data,
          total: response.data.total
        })),
        catchError(this.handleError)
      );
  }

  enregistrerPaiement(data: {
    attribution_prime_id: number;
    montant: number;
    date_paiement: string;
    mode_paiement: string;
    reference?: string;
    commentaire?: string;
  }): Observable<Paiement> {
    return this.http.post<ApiResponse<Paiement>>(`${environment.apiUrl}prime/paiements`, data)
      .pipe(
        map(response => response.data),
        catchError(this.handleError)
      );
  }

  // ==================== UTILITAIRES ====================

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant);
  }

  getStatutBadgeClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'en_attente': 'badge-warning',
      'partiel': 'badge-info',
      'complete': 'badge-success',
      'en_cours': 'badge-primary',
      'termine': 'badge-success',
      'annule': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'partiel': 'Partiel',
      'complete': 'Complété',
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = error.error?.message || error.error?.error || errorMessage;
    }

    console.error('Erreur API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
