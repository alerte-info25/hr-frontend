import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompteComptable } from '../../../models/Caisse/compte-comptable.model';
import { CompteComptableService } from '../../../services/Caisse/compte-comptable.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-compte-comptable',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoaderComponent,
    RouterLink,
  ],
  templateUrl: './compte-comptable.component.html',
  styleUrl: './compte-comptable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompteComptableComponent implements OnInit {
  private fb = inject(FormBuilder);
  private compteService = inject(CompteComptableService);
  private destroyRef = inject(DestroyRef);

  // Liste
  isLoadingList = signal(false);
  comptes = signal<CompteComptable[]>([]);
  searchQuery = signal(''); // ← SIGNAL
  filterActif = signal(''); // ← SIGNAL

  currentPage = signal(1);
  perPage = 15;
  total = signal(0);
  lastPage = signal(1);

  // skeleton loader
  get skeletonArray(): number[] {
    return Array(this.perPage).fill(0);
  }

  // Stats dérivées
  totalComptes = computed(() => this.total());
  comptesActifs = computed(
    () => this.comptes().filter((c) => c.est_actif).length,
  );
  totalOperations = computed(() =>
    this.comptes().reduce(
      (sum, c) => sum + (c.depenses_count ?? 0) + (c.recouvrements_count ?? 0),
      0,
    ),
  );

  // Formulaire
  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    libelle: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
    ],
    description: ['', [Validators.maxLength(500)]],
    est_actif: [true],
  });

  // Suppression
  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  readonly Math = Math;

  // TrackBy
  trackByRfk(index: number, item: CompteComptable): string {
    return item.rfk;
  }

  ngOnInit(): void {
    this.loadList();
  }

  // Chargement liste
  loadList(): void {
    this.isLoadingList.set(true);
    this.compteService
      .getAll({
        search: this.searchQuery() || undefined,
        est_actif:
          this.filterActif() !== '' ? this.filterActif() === 'true' : undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.comptes.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  // ✅ Méthode unifiée pour les filtres
  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  // ✅ Méthode pour la recherche (appelée depuis le template)
  onSearch(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadList();
  }

  // Pagination
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.lastPage();
    const delta = 2;

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
  });

  // Formulaire
  resetForm(): void {
    this.editingRfk.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({ libelle: '', description: '', est_actif: true });
  }

  editCompte(c: CompteComptable): void {
    this.editingRfk.set(c.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.patchValue({
      libelle: c.libelle,
      description: c.description,
      est_actif: c.est_actif,
    });
    document
      .getElementById('compteForm')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);

    const payload = this.form.value;
    const request$ = this.isEditMode()
      ? this.compteService.update(this.editingRfk()!, payload)
      : this.compteService.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Compte mis à jour avec succès.'
            : 'Compte créé avec succès.',
        );
        this.isSaving.set(false);
        this.resetForm();
        this.loadList();
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'Une erreur est survenue.');
        this.isSaving.set(false);
      },
    });
  }

  // Suppression
  deleteCompte(c: CompteComptable): void {
    if (
      !confirm(
        `Supprimer le compte « ${c.libelle} » ? Cette action est irréversible.`,
      )
    )
      return;
    this.isDeleting.set(c.rfk);
    this.deleteError.set(null);

    this.compteService
      .delete(c.rfk)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(null);
          this.loadList();
        },
        error: (err) => {
          this.deleteError.set(
            err?.error?.message ?? 'Impossible de supprimer ce compte.',
          );
          this.isDeleting.set(null);
        },
      });
  }

  // Helpers formulaire
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return null;
    if (ctrl.errors['required']) return 'Ce champ est obligatoire.';
    if (ctrl.errors['minlength'])
      return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    if (ctrl.errors['maxlength'])
      return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }
}
