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
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicePropose } from '../../../models/Caisse/service-propose.model';
import { ServiceProposeService } from '../../../services/Caisse/service-propose.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { RouterLink } from '@angular/router';

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
  selector: 'app-service-propose',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoaderComponent,
    RouterLink,
  ],
  templateUrl: './service-propose.component.html',
  styleUrl: './service-propose.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceProposeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private serviceProposeService = inject(ServiceProposeService);
  private destroyRef = inject(DestroyRef);

  isLoadingList = signal(false);
  services = signal<ServicePropose[]>([]);
  searchQuery = signal('');

  currentPage = signal(1);
  perPage = 15;
  total = signal(0);
  lastPage = signal(1);

  // skeletal loading state
  get skeletonArray(): number[] {
    return Array(this.perPage).fill(0);
  }

  totalServices = computed(() => this.total());
  totalRecouvrements = computed(() =>
    this.services().reduce((sum, s) => sum + (s.recouvrements_count ?? 0), 0),
  );

  moyenneParService = computed(() => {
    const count = this.services().length;
    if (count === 0) return 0;
    return this.totalRecouvrementsMontant() / count;
  });

  totalRecouvrementsMontant = computed(() =>
    this.services().reduce(
      (sum, s) => sum + Number(s.recouvrements_sum_montant ?? 0),
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
    description: ['', [Validators.maxLength(500)]],
  });

  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  readonly Math = Math;

  // ✅ Getter pour les pages visibles avec ellipses
  get visiblePages(): number[] {
    return getVisiblePages(this.currentPage(), this.lastPage());
  }

  trackByRfk(index: number, item: ServicePropose): string {
    return item.rfk;
  }

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.isLoadingList.set(true);
    this.serviceProposeService
      .getAll({
        search: this.searchQuery() || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.services.set(res.data);
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
    this.form.reset({ nom: '', description: '' });
  }

  editService(service: ServicePropose): void {
    this.editingRfk.set(service.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.patchValue({
      nom: service.nom,
      description: service.description,
    });
    document
      .getElementById('serviceForm')
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
      ? this.serviceProposeService.update(this.editingRfk()!, payload)
      : this.serviceProposeService.create(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Service mis à jour avec succès.'
            : 'Service créé avec succès.',
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

  deleteService(service: ServicePropose): void {
    if (
      !confirm(
        `Supprimer le service « ${service.nom} » ? Cette action est irréversible.`,
      )
    )
      return;
    this.isDeleting.set(service.rfk);
    this.deleteError.set(null);
    this.serviceProposeService
      .delete(service.rfk)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(null);
          this.loadList();
        },
        error: (err) => {
          this.deleteError.set(
            err?.error?.message ?? 'Impossible de supprimer ce service.',
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
}
