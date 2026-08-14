import {
  Component,
  inject,
  OnInit,
  signal,
  DestroyRef,
  computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BureauService } from '../../../../services/Caisse/bureau.service';
import { ExerciceComptableService } from '../../../../services/Caisse/exercice-comptable.service';
import { PeriodeService } from '../../../../services/Caisse/periode.service';
import {
  BureauDetailData,
  BureauOperation,
  BureauOperationsFilters,
  TypeOperation,
  TYPE_OPERATION_OPTIONS,
  COMPTABILISATION_OPTIONS,
  TYPE_OPERATION_LABELS,
} from '../../../../models/Caisse/bureau.model';
import { ExerciceModel } from '../../../../models/Caisse/exercice-comptable.model';
import { Periode } from '../../../../models/Caisse/periode.model';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';

// Fonction utilitaire pour la pagination
function getVisiblePages(
  current: number,
  total: number,
  delta: number = 2,
): number[] {
  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  pages.push(1);

  let start = Math.max(2, current - delta);
  let end = Math.min(total - 1, current + delta);

  if (current - delta <= 2) {
    end = Math.min(total - 1, 5);
  }
  if (current + delta >= total - 1) {
    start = Math.max(2, total - 4);
  }

  if (start > 2) pages.push(-1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push(-2);
  pages.push(total);

  return pages;
}

@Component({
  selector: 'app-detail-bureau',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoaderComponent],
  templateUrl: './detail-bureau.component.html',
  styleUrls: ['./detail-bureau.component.scss'],
})
export class DetailBureauComponent implements OnInit {
  private bureauService = inject(BureauService);
  private exerciceService = inject(ExerciceComptableService);
  private periodeService = inject(PeriodeService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  // Identifiant du bureau
  bureauRfk = signal<string>('');

  // États
  loading = signal(false);
  error = signal<string | null>(null);

  // Données principales
  bureauData = signal<BureauDetailData | null>(null);

  // Liste des exercices
  exercices = signal<ExerciceModel[]>([]);
  // Liste des périodes (dépend de l'exercice sélectionné)
  periodes = signal<Periode[]>([]);

  // Filtres sélectionnés
  selectedExerciceId = signal<number | null>(null);
  selectedPeriodeId = signal<number | null>(null);
  selectedType = signal<'entree' | 'sortie' | null>(null);
  searchTerm = signal<string>('');

  // NOUVEAUX FILTRES
  selectedTypeOperation = signal<string>('');
  selectedAComptabiliser = signal<string>('');

  // Pagination
  currentPage = signal(1);
  perPage = 15;

  // Computed pour les opérations paginées
  operations = computed(() => {
    const data = this.bureauData();
    return data?.operations.data ?? [];
  });

  totalOperations = computed(() => {
    const data = this.bureauData();
    return data?.totaux.nb_operations ?? 0;
  });

  totalPages = computed(() => {
    const data = this.bureauData();
    return data?.operations.last_page ?? 1;
  });

  // NOUVEAU : Vérifier si des filtres sont actifs
  hasActiveFilters = computed(() => {
    return !!(
      // this.selectedExerciceId() ||
      // this.selectedPeriodeId() ||
      this.selectedType() ||
      this.searchTerm() ||
      this.selectedTypeOperation() ||
      this.selectedAComptabiliser()
    );
  });

  // NOUVEAU : Libellés des types d'opération
  readonly typeOperationLabels = TYPE_OPERATION_LABELS;
  readonly typeOperationOptions = TYPE_OPERATION_OPTIONS;
  readonly comptabilisationOptions = COMPTABILISATION_OPTIONS;

  // Getter pour les pages visibles avec ellipses
  get visiblePages(): number[] {
    return getVisiblePages(this.currentPage(), this.totalPages());
  }

  ngOnInit(): void {
    const rfk = this.route.snapshot.paramMap.get('rfk');
    if (rfk) {
      this.bureauRfk.set(rfk);
      this.loadExercices();
    } else {
      this.error.set('Aucun bureau spécifié.');
    }
  }

  // Charger la liste des exercices
  private loadExercices(): void {
    this.exerciceService
      .getAll({ per_page: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const exercices = res.data;
          this.exercices.set(exercices);
          const actif = exercices.find((e) => e.est_actif && !e.est_cloture);
          if (actif) {
            this.selectedExerciceId.set(actif.id);
            this.loadPeriodes(actif.id);
          } else if (exercices.length > 0) {
            this.selectedExerciceId.set(exercices[0].id);
            this.loadPeriodes(exercices[0].id);
          }
          this.loadData();
        },
        error: () => {
          this.error.set('Impossible de charger les exercices.');
          this.loadData();
        },
      });
  }

  // Charger les périodes d'un exercice
  private loadPeriodes(exerciceId: number): void {
    this.periodeService
      .getAll({ exercice_rfk: this.getExerciceRfk(exerciceId), per_page: 100 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.periodes.set(res.data);
        },
        error: () => {
          this.periodes.set([]);
        },
      });
  }

  // Helper pour obtenir le rfk d'un exercice à partir de son id
  private getExerciceRfk(exerciceId: number): string {
    const ex = this.exercices().find((e) => e.id === exerciceId);
    return ex?.rfk ?? '';
  }

  // Chargement des données du bureau avec filtres
  private loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters: BureauOperationsFilters = {
      exercice_id: this.selectedExerciceId() ?? undefined,
      periode_id: this.selectedPeriodeId() ?? undefined,
      type: this.selectedType() ?? undefined,
      search: this.searchTerm() || undefined,
      per_page: this.perPage,
      page: this.currentPage(),
      // NOUVEAUX FILTRES
      type_operation:
        (this.selectedTypeOperation() as TypeOperation) || undefined,
      a_comptabiliser:
        this.selectedAComptabiliser() !== ''
          ? this.selectedAComptabiliser() === 'true'
          : undefined,
    };

    this.bureauService
      .getOperations(this.bureauRfk(), filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.bureauData.set(data);
          this.loading.set(false);

          const lastPage = data.operations.last_page ?? 1;
          if (this.currentPage() > lastPage) {
            this.currentPage.set(lastPage);
            this.loadData();
          }
        },
        error: (err) => {
          this.error.set(
            err.message || 'Erreur lors du chargement des données.',
          );
          this.loading.set(false);
        },
      });
  }

  // Changement d'exercice
  onExerciceChange(exerciceId: number | null): void {
    this.selectedExerciceId.set(exerciceId);
    this.selectedPeriodeId.set(null);
    this.currentPage.set(1);
    if (exerciceId) {
      this.loadPeriodes(exerciceId);
    } else {
      this.periodes.set([]);
    }
    this.loadData();
  }

  // Changement de période
  onPeriodeChange(periodeId: number | null): void {
    this.selectedPeriodeId.set(periodeId);
    this.currentPage.set(1);
    this.loadData();
  }

  // Changement de type (entrée/sortie)
  onTypeChange(type: string): void {
    this.selectedType.set(
      type === 'all' ? null : (type as 'entree' | 'sortie'),
    );
    this.currentPage.set(1);
    this.loadData();
  }

  // Changement du type d'opération
  onTypeOperationChange(value: string): void {
    this.selectedTypeOperation.set(value);
    this.currentPage.set(1);
    this.loadData();
  }

  // Changement du filtre de comptabilisation
  onAComptabiliserChange(value: string): void {
    this.selectedAComptabiliser.set(value);
    this.currentPage.set(1);
    this.loadData();
  }

  // Réinitialiser tous les filtres
  resetFilters(): void {
    // Réinitialiser tous les filtres
    this.selectedType.set(null);
    this.searchTerm.set('');
    this.selectedTypeOperation.set('');
    this.selectedAComptabiliser.set('');
    this.currentPage.set(1);

    // IMPORTANT : Recharger les données sans filtres
    this.loadData();
  }

  // Recherche
  onSearch(): void {
    this.currentPage.set(1);
    this.loadData();
  }

  // Pagination
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
  }

  // Rafraîchir
  refresh(): void {
    this.loadData();
  }

  // Obtenir le libellé du type d'opération
  getTypeOperationLabel(type: string | null): string {
    if (!type) return 'Non définit';
    return (
      this.typeOperationLabels[type as keyof typeof this.typeOperationLabels] ||
      type
    );
  }

  // Obtenir le badge de comptabilisation
  getComptabilisationBadge(aComptabiliser: boolean): string {
    return aComptabiliser ? 'Comptabilisée' : 'Non comptabilisée';
  }

  // Formatage des montants
  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(montant);
  }

  // NOUVEAU : Obtenir la couleur du type d'opération
  getTypeOperationColor(type: string | null): string {
    if (!type) return '#6c757d'; // Gris par défaut

    const colors: Record<string, string> = {
      courant: '#10B981', // Vert
      interne_banque_caisse: '#F59E0B', // Orange
      interne_caisse_banque: '#8B5CF6', // Violet
      interne_banque_banque: '#3B82F6', // Bleu
    };

    return colors[type] || '#6c757d';
  }
}
