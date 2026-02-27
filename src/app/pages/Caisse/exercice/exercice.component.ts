import { Component, inject, OnInit, signal } from '@angular/core';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ExerciceComptable,
  ExerciceComptablePayload,
} from '../../../models/Caisse/exercice-comptable.model';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exercice',
  imports: [ReactiveFormsModule, LoaderComponent, CommonModule],
  templateUrl: './exercice.component.html',
  styleUrl: './exercice.component.scss',
})
export class ExerciceComponent implements OnInit {
  private fb = inject(FormBuilder);
  private exerciceComptableService = inject(ExerciceComptableService);
  private router = inject(Router)

  loader = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);
  cloturerRfk = signal<string | null>(null);

  exercices = signal<ExerciceComptable[]>([]);

  exerciceComptableForm = this.fb.nonNullable.group({
    libelle: ['', Validators.required],
    date_debut: ['', Validators.required],
    date_fin: ['', Validators.required],
    statut: this.fb.nonNullable.control<'ouvert' | 'cloture'>(
      'ouvert',
      Validators.required,
    ),
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loader.set(true);
    this.exerciceComptableService.getAll().subscribe({
      next: (data) => {
        this.exercices.set(data);
        this.loader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.loader.set(false);
      },
    });
  }

  isActif(exercice: ExerciceComptable): boolean {
    return exercice.statut === 'ouvert';
  }

  formatResultat(exercice: ExerciceComptable): string {
    const resultat = exercice.resultat ?? 0;
    const signe = resultat >= 0 ? '+' : '';
    return `${signe}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(resultat)} Fcfa`;
  }

  onCloturer(rfk: string): void {
    if (
      !confirm(
        'Voulez-vous clôturer cet exercice ? Cette action est irréversible.',
      )
    )
      return;

    this.cloturerRfk.set(rfk);

    this.exerciceComptableService.cloturer(rfk).subscribe({
      next: (data) => {
        this.exercices.update((liste) =>
          liste.map((e) => (e.rfk === rfk ? { ...e, statut: data.statut } : e)),
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
    if (this.exerciceComptableForm.invalid) {
      this.exerciceComptableForm.markAllAsTouched();
      return;
    }

    this.loader.set(true);

    const payload: ExerciceComptablePayload =
      this.exerciceComptableForm.getRawValue();

    this.exerciceComptableService.create(payload).subscribe({
      next: (data) => {
        this.exercices.update((liste) => [data, ...liste]);
        this.success.set(true);
        this.loader.set(false);
        this.exerciceComptableForm.reset({ statut: 'ouvert' });
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.loader.set(false);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  onConsultation (rfk: string) {
    this.router.navigate(['/caisse/detail-exercice', rfk])
  }
}
