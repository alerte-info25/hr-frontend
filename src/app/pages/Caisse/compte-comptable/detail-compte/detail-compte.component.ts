import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  takeUntil,
  switchMap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { CompteComptableService } from '../../../../services/Caisse/compte-comptable.service';
import {
  CompteComptable,
  CompteOperation,
  CompteOperationsData,
  CompteStats,
} from '../../../../models/Caisse/compte-comptable.model';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-detail-compte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoaderComponent],
  templateUrl: './detail-compte.component.html',
  styleUrls: ['./detail-compte.component.scss'],
})
export class DetailCompteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private search$ = new Subject<string>();

  // Données du compte
  compte: CompteComptable | null = null;
  stats: CompteStats | null = null;

  // Opérations paginées
  operationsData: CompteOperationsData | null = null;
  operations: CompteOperation[] = [];

  // Filtres
  filterType: 'entree' | 'sortie' | '' = '';
  filterSearch: string = '';

  // Pagination
  currentPage = 1;
  perPage = 10;
  totalItems = 0;
  totalPages = 0;
  pagesArray: number[] = [];

  // États de chargement séparés : un loader global aurait masqué toute la page
  // à chaque pagination/filtre, alors qu'on veut juste griser le tableau
  isLoadingCompte = false;
  isLoadingStats = false;
  isLoadingOperations = false;

  // Erreurs
  errorCompte: string | null = null;
  errorOperations: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private compteService: CompteComptableService,
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const rfk = params['rfk'];
          if (!rfk) {
            this.router.navigate(['/caisse/comptes']);
            return [];
          }
          this.loadAllData(rfk);
          return [];
        }),
      )
      .subscribe();

    // Debounce : on attend 300ms après la dernière frappe et on ignore
    // les valeurs identiques pour éviter de spammer le backend
    this.search$
      .pipe(takeUntil(this.destroy$), debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.onFilterChange());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllData(rfk: string): void {
    this.isLoadingCompte = true;
    this.errorCompte = null;

    this.compteService
      .getOne(rfk)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (compte) => {
          this.compte = compte;
          this.isLoadingCompte = false;
        },
        error: (err) => {
          console.error('Erreur chargement compte', err);
          this.isLoadingCompte = false;
          this.errorCompte =
            'Impossible de charger ce compte. Réessaie plus tard.';
        },
      });

    this.isLoadingStats = true;
    this.compteService
      .getStats(rfk)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isLoadingStats = false;
        },
        error: (err) => {
          console.error('Erreur chargement stats', err);
          this.isLoadingStats = false;
        },
      });

    this.loadOperations(rfk);
  }

  private loadOperations(rfk: string): void {
    this.isLoadingOperations = true;
    this.errorOperations = null;

    const filters: any = {
      per_page: this.perPage,
      page: this.currentPage,
    };
    if (this.filterType) {
      filters.type = this.filterType;
    }
    if (this.filterSearch) {
      filters.search = this.filterSearch;
    }

    this.compteService
      .getOperations(rfk, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.operationsData = data;
          this.operations = data.operations.data;
          this.totalItems = data.operations.total;
          this.totalPages = data.operations.last_page;
          this.currentPage = data.operations.current_page;
          this.pagesArray = Array.from(
            { length: this.totalPages },
            (_, i) => i + 1,
          );
          this.isLoadingOperations = false;
        },
        error: (err) => {
          console.error('Erreur chargement opérations', err);
          this.isLoadingOperations = false;
          this.errorOperations =
            'Impossible de charger les opérations. Réessaie.';
        },
      });
  }

  // Méthodes de filtrage
  onFilterChange(): void {
    if (this.compte) {
      this.currentPage = 1;
      this.loadOperations(this.compte.rfk);
    }
  }

  // Branché sur (input) de la zone de recherche : pousse dans le Subject debounced
  onSearchInput(): void {
    this.search$.next(this.filterSearch);
  }

  // Pagination
  goToPage(page: number): void {
    if (
      page < 1 ||
      page > this.totalPages ||
      page === this.currentPage ||
      this.isLoadingOperations
    )
      return;
    this.currentPage = page;
    if (this.compte) {
      this.loadOperations(this.compte.rfk);
    }
  }

  retryLoadOperations(): void {
    if (this.compte) {
      this.loadOperations(this.compte.rfk);
    }
  }

  retryLoadCompte(): void {
    const rfk = this.route.snapshot.params['rfk'];
    if (rfk) {
      this.loadAllData(rfk);
    }
  }

  // Pour les classes CSS dynamiques
  getBadgeClass(type: string): string {
    return type === 'entree' ? 'badge-success' : 'badge-danger';
  }

  getAmountClass(type: string): string {
    return type === 'entree' ? 'amount-debit' : 'amount-credit';
  }
}
