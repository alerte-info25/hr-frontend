import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
})
export class ExerciceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private exerciceService = inject(ExerciceComptableService);
  private router = inject(Router);

  loader = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);
  cloturerRfk = signal<string | null>(null);

  exercices = signal<ExerciceModel[]>([]);

  // Pagination
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  perPage = signal(15);

  pageRange = computed(() => {
    const current = this.currentPage();
    const last = this.lastPage();
    if (last <= 1) return [];
    const start = Math.max(1, current - 2);
    const end = Math.min(last, current + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
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

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loader.set(true);
    this.exerciceService
      .getAll({ page: this.currentPage(), per_page: this.perPage() })
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

  // true = exercice en cours (actif et non clôturé)
  isActif(exercice: ExerciceModel): boolean {
    return exercice.est_actif && !exercice.est_cloture;
  }

  // Libellé du badge statut
  getStatutLabel(exercice: ExerciceModel): string {
    if (exercice.est_cloture) return 'Clôturé';
    if (exercice.est_actif) return 'Actif';
    return 'Inactif';
  }

  // Classe CSS du badge statut
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

    this.exerciceService.cloturer(rfk).subscribe({
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

    this.exerciceService.create(payload).subscribe({
      next: (created) => {
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
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.loader.set(false);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  onConsultation(rfk: string): void {
    this.router.navigate(['/caisse/detail-exercice', rfk]);
  }
}
