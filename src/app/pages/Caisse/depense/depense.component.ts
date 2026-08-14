import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Depense,
  MODE_PAIEMENT_LABELS,
  MODE_PAIEMENT_ICONS,
  ModePaiement,
  TypeOperation,
  TYPE_OPERATION_LABELS,
  TYPE_OPERATION_OPTIONS,
} from '../../../models/Caisse/depense.model';
import { ExerciceModel } from '../../../models/Caisse/exercice-comptable.model';
import { Periode } from '../../../models/Caisse/periode.model';
import { DepenseService } from '../../../services/Caisse/depense.service';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import { PeriodeService } from '../../../services/Caisse/periode.service';
import { TypeDepenseService } from '../../../services/Caisse/type-depense.service';
import { FournisseurService } from '../../../services/Caisse/fournisseurs.service';
import { BureauService } from '../../../services/Caisse/bureau.service';
import { CompteComptableService } from '../../../services/Caisse/compte-comptable.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-depense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoaderComponent],
  templateUrl: './depense.component.html',
  styleUrl: './depense.component.scss',
})
export class DepenseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private depenseService = inject(DepenseService);
  private exerciceService = inject(ExerciceComptableService);
  private periodeService = inject(PeriodeService);
  private typeDepenseService = inject(TypeDepenseService);
  private compteService = inject(CompteComptableService);
  private fournisseurService = inject(FournisseurService);
  private bureauService = inject(BureauService);

  // Référentiels pour les selects
  exercices = signal<ExerciceModel[]>([]);
  periodes = signal<Periode[]>([]);
  typesDepense = signal<any[]>([]);
  comptes = signal<any[]>([]);
  fournisseurs = signal<any[]>([]);
  bureaux = signal<any[]>([]);
  isLoadingRefs = signal(true);

  // Liste
  isLoadingList = signal(false);
  depenses = signal<Depense[]>([]);
  currentPage = signal(1);
  perPage = 15;
  total = signal(0);
  lastPage = signal(1);

  // Statistiques
  isLoadingStats = signal(false);
  statsData = signal<any>(null);
  totalMontant = signal<number>(0);
  nombreDepenses = signal<number>(0);
  statsParType = signal<any[]>([]);
  statsParBureau = signal<any[]>([]);
  statsParModePaiement = signal<any[]>([]);
  statsEvolution = signal<any[]>([]);

  pageTotal = computed(() =>
    this.depenses().reduce((sum, d) => sum + Number(d.montant), 0),
  );

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.lastPage();
    const delta = 2;

    if (total <= 1) return [1];
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [];
    pages.push(1);

    let start = Math.max(2, current - delta);
    let end = Math.min(total - 1, current + delta);

    if (current - delta <= 2) end = Math.min(total - 1, 5);
    if (current + delta >= total - 1) start = Math.max(2, total - 4);

    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-2);
    pages.push(total);

    return pages;
  });

  get skeletonArray(): number[] {
    return Array(this.perPage).fill(0);
  }

  // Filtres liste
  filterExerciceId = '';
  filterTypeId = '';
  filterMode = '';
  filterSearch = '';
  // NOUVEAUX FILTRES
  filterTypeOperation = '';
  filterAComptabiliser = '';

  // Formulaire
  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    exercice_id: [null, Validators.required],
    periode_id: [null, Validators.required],
    bureau_id: [null, Validators.required],
    type_depense_id: [null, Validators.required],
    compte_comptable_id: [null, Validators.required],
    fournisseur_id: [null],
    date_depense: ['', Validators.required],
    montant: [null, [Validators.required, Validators.min(0.01)]],
    mode_paiement: [null],
    reference_paiement: [''],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    // NOUVEAUX CHAMPS
    type_operation: ['courant'],
    a_comptabiliser: [true],
  });

  // Suppression
  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  // Labels
  readonly modePaiementLabels = MODE_PAIEMENT_LABELS;
  readonly modePaiementIcons = MODE_PAIEMENT_ICONS;
  readonly modesOptions = Object.entries(MODE_PAIEMENT_LABELS) as [
    ModePaiement,
    string,
  ][];
  // NOUVEAU
  readonly typeOperationOptions = TYPE_OPERATION_OPTIONS;
  readonly typeOperationLabels = TYPE_OPERATION_LABELS;
  readonly Math = Math;

  // Lifecycle
  ngOnInit(): void {
    this.loadReferentiels();
  }

  // Chargement SÉQUENTIEL des référentiels
  private loadReferentiels(): void {
    this.isLoadingRefs.set(true);
    this.loadExercices();
  }

  private loadExercices(): void {
    this.exerciceService.getListe().subscribe({
      next: (data) => {
        this.exercices.set(data.filter((e) => !e.est_cloture));
        const actif = data.find((e) => e.est_actif && !e.est_cloture);
        if (actif) {
          this.form.patchValue({ exercice_id: actif.id });
          this.onExerciceChange(actif.id);
        }
        this.loadTypesDepense();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadTypesDepense(): void {
    this.typeDepenseService.getListe().subscribe({
      next: (data) => {
        this.typesDepense.set(data);
        this.loadComptes();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadComptes(): void {
    this.compteService.getListe().subscribe({
      next: (data) => {
        this.comptes.set(data);
        this.loadFournisseurs();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadFournisseurs(): void {
    this.fournisseurService.getListe().subscribe({
      next: (data) => {
        this.fournisseurs.set(data);
        this.loadBureaux();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadBureaux(): void {
    this.bureauService.getListe().subscribe({
      next: (data) => {
        this.bureaux.set(data);
        this.isLoadingRefs.set(false);
        this.loadList();
        this.loadStats();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  onExerciceChange(exerciceId: number | string): void {
    this.form.patchValue({ periode_id: null });
    this.periodes.set([]);
    this.form.get('periode_id')?.disable();

    if (!exerciceId) return;

    const ex = this.exercices().find((e) => e.id === Number(exerciceId));
    if (!ex) return;

    this.periodeService.getListe(ex.rfk).subscribe({
      next: (data) => {
        this.periodes.set(data.filter((p) => !p.est_cloturee));
        this.form.get('periode_id')?.enable();
      },
    });
  }

  // Chargement liste
  loadList(): void {
    this.isLoadingList.set(true);

    // Construire les filtres correctement
    const filters: any = {};

    if (this.filterSearch) filters.search = this.filterSearch;
    if (this.filterExerciceId)
      filters.exercice_id = Number(this.filterExerciceId);
    if (this.filterTypeId) filters.type_depense_id = Number(this.filterTypeId);
    if (this.filterMode) filters.mode_paiement = this.filterMode;
    if (this.filterTypeOperation)
      filters.type_operation = this.filterTypeOperation;

    // CORRECTION : Envoyer un booléen ou null
    if (this.filterAComptabiliser !== '') {
      filters.a_comptabiliser = this.filterAComptabiliser === 'true';
    }

    filters.page = this.currentPage();
    filters.per_page = this.perPage;

    this.depenseService.getAll(filters).subscribe({
      next: (res) => {
        this.depenses.set(res.data);
        this.total.set(res.total);
        this.lastPage.set(res.last_page);
        this.isLoadingList.set(false);
      },
      error: () => this.isLoadingList.set(false),
    });
  }

  // Chargement des statistiques
  loadStats(): void {
    this.isLoadingStats.set(true);
    const filters: any = {};

    if (this.filterExerciceId) {
      filters.exercice_id = Number(this.filterExerciceId);
    }
    if (this.filterTypeId) {
      filters.type_depense_id = Number(this.filterTypeId);
    }
    if (this.filterMode) {
      filters.mode_paiement = this.filterMode;
    }
    if (this.filterSearch) {
      filters.search = this.filterSearch;
    }

    this.depenseService.getStats(filters).subscribe({
      next: (response) => {
        this.isLoadingStats.set(false);
        this.statsData.set(response);
        this.totalMontant.set(response.total_montant || 0);
        this.nombreDepenses.set(response.nombre || 0);
        this.statsParType.set(response.par_type || []);
        this.statsParBureau.set(response.par_bureau || []);
        this.statsParModePaiement.set(response.par_mode_paiement || []);
        this.statsEvolution.set(response.evolution || []);
      },
      error: (error) => {
        this.isLoadingStats.set(false);
        console.error('Erreur lors du chargement des statistiques:', error);
        this.totalMontant.set(0);
        this.nombreDepenses.set(0);
        this.statsParType.set([]);
        this.statsParBureau.set([]);
        this.statsParModePaiement.set([]);
        this.statsEvolution.set([]);
      },
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadList();
    this.loadStats();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadList();
  }

  // NOUVEAU : Toggle de comptabilisation
  toggleComptabilisation(depense: Depense): void {
    const newValue = !depense.a_comptabiliser;
    this.depenseService
      .toggleComptabilisation(depense.rfk, newValue)
      .subscribe({
        next: () => {
          // Mettre à jour localement
          const updated = this.depenses().map((d) =>
            d.rfk === depense.rfk ? { ...d, a_comptabiliser: newValue } : d,
          );
          this.depenses.set(updated);
          this.loadStats(); // Recharger les stats
        },
        error: (err) => {
          this.formError.set(
            err?.error?.message ?? 'Erreur lors de la mise à jour.',
          );
        },
      });
  }

  // Formulaire
  resetForm(): void {
    this.editingRfk.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      exercice_id: null,
      periode_id: null,
      bureau_id: null,
      type_depense_id: null,
      compte_comptable_id: null,
      fournisseur_id: null,
      date_depense: '',
      montant: null,
      mode_paiement: null,
      reference_paiement: '',
      description: '',
      type_operation: 'courant',
      a_comptabiliser: true,
    });
    const actif = this.exercices().find((e) => e.est_actif);
    if (actif) {
      this.form.patchValue({ exercice_id: actif.id });
      this.onExerciceChange(actif.id);
    } else {
      this.form.get('periode_id')?.disable();
    }
    document
      .getElementById('depenseForm')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  editDepense(d: Depense): void {
    this.editingRfk.set(d.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);

    this.onExerciceChange(d.exercice_id);

    this.form.patchValue({
      exercice_id: d.exercice_id,
      periode_id: d.periode_id,
      bureau_id: d.bureau_id,
      type_depense_id: d.type_depense_id,
      compte_comptable_id: d.compte_comptable_id,
      fournisseur_id: d.fournisseur_id,
      date_depense: d.date_depense.substring(0, 10),
      montant: d.montant,
      mode_paiement: d.mode_paiement,
      reference_paiement: d.reference_paiement,
      description: d.description,
      type_operation: d.type_operation || 'courant',
      a_comptabiliser: d.a_comptabiliser,
    });

    document
      .getElementById('depenseForm')
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
      ? this.depenseService.update(this.editingRfk()!, payload)
      : this.depenseService.create(payload);

    request$.subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Dépense mise à jour avec succès.'
            : 'Dépense enregistrée avec succès.',
        );
        this.isSaving.set(false);
        this.resetForm();
        this.loadList();
        this.loadStats();
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'Une erreur est survenue.');
        this.isSaving.set(false);
      },
    });
  }

  // Suppression
  deleteDepense(d: Depense): void {
    if (
      !confirm(
        `Supprimer la dépense « ${d.rfk} » de ${Number(d.montant).toLocaleString('fr')} F ?`,
      )
    )
      return;
    this.isDeleting.set(d.rfk);
    this.deleteError.set(null);

    this.depenseService.delete(d.rfk).subscribe({
      next: () => {
        this.isDeleting.set(null);
        this.loadList();
        this.loadStats();
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer cette dépense.',
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
    if (ctrl.errors['min']) return 'Le montant doit être supérieur à 0.';
    if (ctrl.errors['maxlength'])
      return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }
}
