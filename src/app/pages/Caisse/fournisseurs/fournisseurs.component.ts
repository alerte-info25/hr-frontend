import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Fournisseur } from '../../../models/Caisse/fournisseur.model';
import { FournisseurService } from '../../../services/Caisse/fournisseurs.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-fournisseur',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoaderComponent,
  ],
  templateUrl: './fournisseurs.component.html',
  styleUrl: './fournisseurs.component.scss',
})
export class FournisseursComponent implements OnInit {
  private fb = inject(FormBuilder);
  private fournisseurService = inject(FournisseurService);

  isLoadingList = signal(false);
  fournisseurs = signal<Fournisseur[]>([]);
  searchQuery = '';

  currentPage = signal(1);
  perPage = 10;
  total = signal(0);
  lastPage = signal(1);

  totalFournisseurs = computed(() => this.total());
  totalDepenses = computed(() =>
    this.fournisseurs().reduce((sum, f) => sum + (f.depenses_count ?? 0), 0),
  );
  fournisseursActifs = computed(
    () => this.fournisseurs().filter((f) => (f.depenses_count ?? 0) > 0).length,
  );
  totalDepensesMontant = computed(() =>
    // ← ajout
    this.fournisseurs().reduce(
      (sum, f) => sum + (f.depenses_sum_montant ?? 0),
      0,
    ),
  );

  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    nom: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    contact: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    telephone: ['', [Validators.maxLength(20)]],
    adresse: ['', [Validators.maxLength(255)]],
  });

  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  readonly Math = Math;

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.isLoadingList.set(true);
    this.fournisseurService
      .getAll({
        search: this.searchQuery || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.fournisseurs.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  onSearch(): void {
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

  resetForm(): void {
    this.editingRfk.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      nom: '',
      contact: '',
      email: '',
      telephone: '',
      adresse: '',
    });
  }

  editFournisseur(f: Fournisseur): void {
    this.editingRfk.set(f.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.patchValue({
      nom: f.nom,
      contact: f.contact,
      email: f.email,
      telephone: f.telephone,
      adresse: f.adresse,
    });
    document
      .getElementById('fournisseurForm')
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
      ? this.fournisseurService.update(this.editingRfk()!, payload)
      : this.fournisseurService.create(payload);

    request$.subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Fournisseur mis à jour avec succès.'
            : 'Fournisseur créé avec succès.',
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

  deleteFournisseur(f: Fournisseur): void {
    if (
      !confirm(
        `Supprimer le fournisseur « ${f.nom} » ? Cette action est irréversible.`,
      )
    )
      return;
    this.isDeleting.set(f.rfk);
    this.deleteError.set(null);
    this.fournisseurService.delete(f.rfk).subscribe({
      next: () => {
        this.isDeleting.set(null);
        this.loadList();
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer ce fournisseur.',
        );
        this.isDeleting.set(null);
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return null;
    if (ctrl.errors['required']) return 'Ce champ est obligatoire.';
    if (ctrl.errors['email']) return 'Adresse email invalide.';
    if (ctrl.errors['minlength'])
      return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    if (ctrl.errors['maxlength'])
      return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }
}
