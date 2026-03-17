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

  //  Référentiels pour les selects
  exercices = signal<ExerciceModel[]>([]);
  periodes = signal<Periode[]>([]);
  typesDepense = signal<any[]>([]);
  comptes = signal<any[]>([]);
  fournisseurs = signal<any[]>([]);
  bureaux = signal<any[]>([]);
  isLoadingRefs = signal(true);

  //  Liste
  isLoadingList = signal(false);
  depenses = signal<Depense[]>([]);
  currentPage = signal(1);
  perPage = 15;
  total = signal(0);
  lastPage = signal(1);

  // Filtres liste
  filterExerciceId = '';
  filterTypeId = '';
  filterMode = '';
  filterSearch = '';

  //  Stats dérivées
  totalMontant = computed(() =>
    this.depenses().reduce((sum, d) => sum + Number(d.montant), 0),
  );

  //  Formulaire
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
  });

  //  Suppression
  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  //  Labels
  readonly modePaiementLabels = MODE_PAIEMENT_LABELS;
  readonly modePaiementIcons = MODE_PAIEMENT_ICONS;
  readonly modesOptions = Object.entries(MODE_PAIEMENT_LABELS) as [
    ModePaiement,
    string,
  ][];
  readonly Math = Math;

  //  Lifecycle
  ngOnInit(): void {
    this.loadReferentiels();
  }

  //  Chargement de tous les référentiels
  private loadReferentiels(): void {
    this.isLoadingRefs.set(true);
    let done = 0;
    const check = () => {
      if (++done === 5) this.isLoadingRefs.set(false);
    };

    this.exerciceService.getAll({ per_page: 100 }).subscribe({
      next: (r) => {
        this.exercices.set(r.data.filter((e) => !e.est_cloture));
        // Pré-sélectionner l'exercice actif
        const actif = r.data.find((e) => e.est_actif && !e.est_cloture);
        if (actif) {
          this.form.patchValue({ exercice_id: actif.id });
          this.onExerciceChange(actif.id);
        }
        check();
      },
      error: check,
    });

    this.typeDepenseService.getAll({ per_page: 100 }).subscribe({
      next: (r) => {
        this.typesDepense.set(r.data);
        check();
      },
      error: check,
    });

    this.compteService.getAll({ per_page: 100 }).subscribe({
      next: (r) => {
        this.comptes.set(r.data);
        check();
      },
      error: check,
    });

    this.fournisseurService.getAll({ per_page: 100 }).subscribe({
      next: (r) => {
        this.fournisseurs.set(r.data);
        check();
      },
      error: check,
    });

    this.bureauService.getAll({ per_page: 100 }).subscribe({
      next: (bureaux) => {
        this.bureaux.set(bureaux);
        check();
      },
      error: check,
    });

    this.loadList();
  }

  //  Changement d'exercice → recharge les périodes
  onExerciceChange(exerciceId: number | string): void {
    this.form.patchValue({ periode_id: null });
    this.periodes.set([]);
    this.form.get('periode_id')?.disable();

    if (!exerciceId) return;

    const ex = this.exercices().find((e) => e.id === Number(exerciceId));
    if (!ex) return;

    this.periodeService
      .getAll({ exercice_rfk: ex.rfk, per_page: 100 })
      .subscribe({
        next: (r) => {
          this.periodes.set(r.data.filter((p) => !p.est_cloturee));
          this.form.get('periode_id')?.enable(); // ← réactive après chargement
        },
      });
  }

  //  Chargement liste
  loadList(): void {
    this.isLoadingList.set(true);
    this.depenseService
      .getAll({
        search: this.filterSearch || undefined,
        exercice_id: this.filterExerciceId
          ? Number(this.filterExerciceId)
          : undefined,
        type_depense_id: this.filterTypeId
          ? Number(this.filterTypeId)
          : undefined,
        mode_paiement: (this.filterMode as ModePaiement) || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.depenses.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadList();
  }

  pages(): number[] {
    return Array.from({ length: this.lastPage() }, (_, i) => i + 1);
  }

  //  Formulaire
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
    });
    // Repré-sélectionner l'exercice actif
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

    // Charger d'abord les périodes de l'exercice
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
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'Une erreur est survenue.');
        this.isSaving.set(false);
      },
    });
  }

  //  Suppression
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
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer cette dépense.',
        );
        this.isDeleting.set(null);
      },
    });
  }

  //  Helpers formulaire
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
