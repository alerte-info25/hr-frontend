import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TypeDepense } from '../../../models/Caisse/type-depense.model';
import { TypeDepenseService } from '../../../services/Caisse/type-depense.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { Router } from '@angular/router';

// ✅ Fonction utilitaire pour la pagination
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
  selector: 'app-type-depense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoaderComponent],
  templateUrl: './type-depense.component.html',
  styleUrl: './type-depense.component.scss',
})
export class TypeDepenseComponent implements OnInit {
  private fb = inject(FormBuilder);
  private typeDepenseService = inject(TypeDepenseService);
  private router = inject(Router);
  readonly Number = Number;

  isLoadingList = signal(false);
  types = signal<TypeDepense[]>([]);
  searchQuery = '';

  currentPage = signal(1);
  perPage = 10;
  total = signal(0);
  lastPage = signal(1);

  // skeleton loaders
  get skeletonArray(): number[] {
    return Array(this.perPage).fill(0);
  }

  totalCategories = computed(() => this.total());
  totalDepensesCount = computed(() =>
    this.types().reduce((sum, t) => sum + (t.depenses_count ?? 0), 0),
  );

  moyenneParCategorie = computed(() => {
    const cats = this.types().length;
    if (cats === 0) return 0;
    const totalMontant = this.types().reduce(
      (sum, t) => sum + Number(t.depenses_sum_montant ?? 0),
      0,
    );
    return totalMontant / cats;
  });

  totalDepensesMontant = computed(() =>
    this.types().reduce(
      (sum, t) => sum + Number(t.depenses_sum_montant ?? 0),
      0,
    ),
  );

  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    libelle: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    description: ['', [Validators.maxLength(500)]],
  });

  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  readonly Math = Math;

  // ✅ Getter pour les pages visibles avec ellipses
  get visiblePages(): number[] {
    return getVisiblePages(this.currentPage(), this.lastPage());
  }

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.isLoadingList.set(true);
    this.typeDepenseService
      .getAll({
        search: this.searchQuery || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
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

  onSearch(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadList();
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
    this.form.patchValue({
      libelle: type.libelle,
      description: type.description,
    });
    document
      .getElementById('expenseForm')
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
      ? this.typeDepenseService.update(this.editingRfk()!, payload)
      : this.typeDepenseService.create(payload);

    request$.subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Type de dépense mis à jour avec succès.'
            : 'Type de dépense créé avec succès.',
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

  deleteType(type: TypeDepense): void {
    if (
      !confirm(
        `Supprimer le type « ${type.libelle} » ? Cette action est irréversible.`,
      )
    )
      return;
    this.isDeleting.set(type.rfk);
    this.deleteError.set(null);
    this.typeDepenseService.delete(type.rfk).subscribe({
      next: () => {
        this.isDeleting.set(null);
        this.loadList();
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer ce type.',
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
    if (ctrl.errors['minlength'])
      return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    if (ctrl.errors['maxlength'])
      return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }

  onView(rfk: string): void {
    this.router.navigate(['/caisse/detail-types-depenses', rfk]);
  }
}
