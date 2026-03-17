import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common'; // ← DecimalPipe ajouté
import { FormsModule } from '@angular/forms';
import { TypeDepense } from '../../../models/Caisse/type-depense.model';
import { TypeDepenseService } from '../../../services/Caisse/type-depense.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-type-depense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoaderComponent], 
  templateUrl: './type-depense.component.html',
  styleUrl: './type-depense.component.scss',
})
export class TypeDepenseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private typeDepenseService = inject(TypeDepenseService);

  isLoadingList = signal(false);
  types = signal<TypeDepense[]>([]);
  searchQuery = '';

  currentPage = signal(1);
  perPage = 10;
  total = signal(0);
  lastPage = signal(1);

  totalCategories = computed(() => this.total());
  totalDepensesCount = computed(() =>
    this.types().reduce((sum, t) => sum + (t.depenses_count ?? 0), 0),
  );
  moyenneParCategorie = computed(() => {
    const cats = this.types().length;
    return cats > 0 ? Math.round(this.totalDepensesCount() / cats) : 0;
  });
  totalDepensesMontant = computed(() => // ← ajout
    this.types().reduce((sum, t) => sum + (t.depenses_sum_montant ?? 0), 0),
  );

  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  readonly Math = Math;

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.isLoadingList.set(true);
    this.typeDepenseService
      .getAll({ search: this.searchQuery || undefined, page: this.currentPage(), per_page: this.perPage })
      .subscribe({
        next: (res) => {
          this.types.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  onSearch(): void { this.currentPage.set(1); this.loadList(); }

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
    this.form.reset({ libelle: '', description: '' });
  }

  editType(type: TypeDepense): void {
    this.editingRfk.set(type.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.patchValue({ libelle: type.libelle, description: type.description });
    document.getElementById('expenseForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);

    const payload = this.form.value;
    const request$ = this.isEditMode()
      ? this.typeDepenseService.update(this.editingRfk()!, payload)
      : this.typeDepenseService.create(payload);

    request$.subscribe({
      next: () => {
        this.formSuccess.set(this.isEditMode() ? 'Type de dépense mis à jour avec succès.' : 'Type de dépense créé avec succès.');
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

  deleteType(type: TypeDepense): void {
    if (!confirm(`Supprimer le type « ${type.libelle} » ? Cette action est irréversible.`)) return;
    this.isDeleting.set(type.rfk);
    this.deleteError.set(null);
    this.typeDepenseService.delete(type.rfk).subscribe({
      next: () => { this.isDeleting.set(null); this.loadList(); },
      error: (err) => {
        this.deleteError.set(err?.error?.message ?? 'Impossible de supprimer ce type.');
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
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    if (ctrl.errors['maxlength']) return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }
}