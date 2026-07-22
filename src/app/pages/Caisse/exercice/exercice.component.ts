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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import {
  ExerciceModel,
  ExercicePayload,
} from '../../../models/Caisse/exercice-comptable.model';

@Component({
  selector: 'app-exercice',
  imports: [ReactiveFormsModule, LoaderComponent, CommonModule],
  templateUrl: './exercice.component.html',
  styleUrl: './exercice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, //
})
export class ExerciceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private exerciceService = inject(ExerciceComptableService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef); //

  loader = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);
  cloturerRfk = signal<string | null>(null);

  exercices = signal<ExerciceModel[]>([]);

  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  perPage = signal(15); //  RÉDUIT

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

  pageStart = computed(() =>
    this.total() === 0 ? 0 : (this.currentPage() - 1) * this.perPage() + 1,
  );

  pageEnd = computed(() =>
    Math.min(this.currentPage() * this.perPage(), this.total()),
  );

  exerciceForm = this.fb.nonNullable.group({
    libelle: [''],
    annee: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    date_debut: ['', Validators.required],
    date_fin: ['', Validators.required],
    est_actif: [true],
  });

  //  TrackBy
  trackByRfk(index: number, item: ExerciceModel): string {
    return item.rfk;
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loader.set(true);
    this.exerciceService
      .getAll({ page: this.currentPage(), per_page: this.perPage() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (paginated) => {
          const liste = Array.isArray(paginated?.data) ? paginated.data : [];
          this.exercices.set(liste);
          this.currentPage.set(paginated?.current_page ?? 1);
          this.lastPage.set(paginated?.last_page ?? 1);
          this.total.set(paginated?.total ?? liste.length);
          this.loader.set(false);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message ?? 'Une erreur est survenue',
          );
          this.loader.set(false);
        },
      });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadData();
  }

  isActif(exercice: ExerciceModel): boolean {
    return exercice.est_actif && !exercice.est_cloture;
  }

  getStatutClass(exercice: ExerciceModel): string {
    if (exercice.est_cloture) return 'closed';
    if (exercice.est_actif) return 'active';
    return 'inactive';
  }

  onCloturer(rfk: string): void {
    if (
      !confirm(
        'Voulez-vous clôturer cet exercice ? Cette action est irréversible.',
      )
    )
      return;

    this.cloturerRfk.set(rfk);

    this.exerciceService
      .cloturer(rfk)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.exercices.update((liste) =>
            liste.map((e) =>
              e.rfk === rfk
                ? {
                    ...e,
                    est_cloture: updated.est_cloture,
                    est_actif: updated.est_actif,
                  }
                : e,
            ),
          );
          this.cloturerRfk.set(null);
          this.success.set(true);
          setTimeout(() => this.success.set(false), 3000);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message ?? 'Erreur lors de la clôture',
          );
          this.cloturerRfk.set(null);
          setTimeout(() => this.errorMessage.set(null), 3000);
        },
      });
  }

  onSubmit(): void {
    if (this.exerciceForm.invalid) {
      this.exerciceForm.markAllAsTouched();
      return;
    }

    this.loader.set(true);

    const raw: ExercicePayload = this.exerciceForm.getRawValue();
    const payload: ExercicePayload = {
      ...raw,
      libelle: `Exercice ${raw.annee}`,
    };

    this.exerciceService
      .create(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadData();
          this.success.set(true);
          this.loader.set(false);
          this.exerciceForm.reset({
            annee: '',
            date_debut: '',
            date_fin: '',
            libelle: '',
          });
          setTimeout(() => this.success.set(false), 3000);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message ?? 'Une erreur est survenue',
          );
          this.loader.set(false);
          setTimeout(() => this.errorMessage.set(null), 3000);
        },
      });
  }

  onConsultation(rfk: string): void {
    this.router.navigate(['/caisse/detail-exercice', rfk]);
  }
}
