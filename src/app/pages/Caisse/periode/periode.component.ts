import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Periode,
  TYPE_PERIODE_LABELS,
  TypePeriode,
} from '../../../models/Caisse/periode.model';
import { ExerciceModel } from '../../../models/Caisse/exercice-comptable.model';
import { PeriodeService } from '../../../services/Caisse/periode.service';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-periode',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LoaderComponent],
  templateUrl: './periode.component.html',
  styleUrl: './periode.component.scss',
})
export class PeriodeComponent implements OnInit {
  private fb = inject(FormBuilder);
  private periodeService = inject(PeriodeService);
  private exerciceService = inject(ExerciceComptableService);

  //  Exercices (pour le sélecteur)
  exercices = signal<ExerciceModel[]>([]);
  exerciceSelectionne = signal<ExerciceModel | null>(null);

  //  Liste des périodes
  isLoadingList = signal(false);
  periodes = signal<Periode[]>([]);
  currentPage = signal(1);
  perPage = 15;
  total = signal(0);
  lastPage = signal(1);

  //  Stats dérivées
  totalPeriodes = computed(() => this.total());
  periodesOuvertes = computed(
    () => this.periodes().filter((p) => !p.est_cloturee).length,
  );
  periodesCloturees = computed(
    () => this.periodes().filter((p) => p.est_cloturee).length,
  );

  //  Formulaire génération
  isGenerating = signal(false);
  genereError = signal<string | null>(null);
  genereSuccess = signal<string | null>(null);

  formGenerer: FormGroup = this.fb.group({
    exercice_rfk: ['', Validators.required],
    type: ['mensuel', Validators.required],
  });

  //  Clôture
  isCloturing = signal<string | null>(null);
  cloturError = signal<string | null>(null);

  //  Suppression
  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  //  Labels
  readonly typesLabels = TYPE_PERIODE_LABELS;
  readonly typeOptions: {
    value: TypePeriode;
    label: string;
    description: string;
  }[] = [
    {
      value: 'mensuel',
      label: 'Mensuel',
      description: '12 périodes — une par mois',
    },
    {
      value: 'trimestriel',
      label: 'Trimestriel',
      description: '4 périodes — T1, T2, T3, T4',
    },
    {
      value: 'semestriel',
      label: 'Semestriel',
      description: '2 périodes — 1er et 2ème semestre',
    },
    {
      value: 'annuel',
      label: 'Annuel',
      description: "1 période — toute l'année",
    },
  ];

  readonly Math = Math;

  //  Lifecycle
  ngOnInit(): void {
    this.loadExercices();
  }

  //  Chargement des exercices
  loadExercices(): void {
    this.exerciceService.getAll({ per_page: 100 }).subscribe({
      next: (res) => {
        this.exercices.set(res.data);
        // Pré-sélectionner l'exercice actif s'il existe
        const actif = res.data.find((e) => e.est_actif && !e.est_cloture);
        if (actif) {
          this.formGenerer.patchValue({ exercice_rfk: actif.rfk });
          this.onExerciceChange(actif.rfk);
        }
      },
    });
  }

  //  Changement d'exercice → recharge les périodes
  onExerciceChange(rfk: string): void {
    if (!rfk) {
      this.periodes.set([]);
      this.exerciceSelectionne.set(null);
      return;
    }
    const ex = this.exercices().find((e) => e.rfk === rfk) ?? null;
    this.exerciceSelectionne.set(ex);
    this.currentPage.set(1);
    this.loadPeriodes(rfk);
  }

  //  Chargement des périodes de l'exercice sélectionné
  loadPeriodes(exerciceRfk?: string): void {
    const rfk = exerciceRfk ?? this.formGenerer.get('exercice_rfk')?.value;
    if (!rfk) return;

    this.isLoadingList.set(true);
    this.periodeService
      .getAll({
        exercice_rfk: rfk,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.periodes.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadPeriodes();
  }

  pages(): number[] {
    return Array.from({ length: this.lastPage() }, (_, i) => i + 1);
  }

  //  Génération
  generer(): void {
    if (this.formGenerer.invalid) {
      this.formGenerer.markAllAsTouched();
      return;
    }

    this.isGenerating.set(true);
    this.genereError.set(null);
    this.genereSuccess.set(null);

    this.periodeService.generer(this.formGenerer.value).subscribe({
      next: (periodes) => {
        this.genereSuccess.set(
          `${periodes.length} période(s) générée(s) avec succès.`,
        );
        this.isGenerating.set(false);
        this.loadPeriodes();
      },
      error: (err) => {
        this.genereError.set(
          err?.error?.message ?? 'Erreur lors de la génération.',
        );
        this.isGenerating.set(false);
      },
    });
  }

  //  Clôture d'une période
  cloturer(periode: Periode): void {
    if (
      !confirm(
        `Clôturer la période « ${periode.libelle} » ? Cette action est irréversible.`,
      )
    )
      return;
    this.isCloturing.set(periode.rfk);
    this.cloturError.set(null);

    this.periodeService.cloturer(periode.rfk).subscribe({
      next: () => {
        this.isCloturing.set(null);
        this.loadPeriodes();
      },
      error: (err) => {
        this.cloturError.set(
          err?.error?.message ?? 'Erreur lors de la clôture.',
        );
        this.isCloturing.set(null);
      },
    });
  }

  //  Suppression d'une période
  deletePeriode(periode: Periode): void {
    if (!confirm(`Supprimer la période « ${periode.libelle} » ?`)) return;
    this.isDeleting.set(periode.rfk);
    this.deleteError.set(null);

    this.periodeService.delete(periode.rfk).subscribe({
      next: () => {
        this.isDeleting.set(null);
        this.loadPeriodes();
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer cette période.',
        );
        this.isDeleting.set(null);
      },
    });
  }

  //  Aperçu des périodes qui seront générées
  apercu = computed(() => {
    const ex = this.exerciceSelectionne();
    const type = this.formGenerer.get('type')?.value as TypePeriode;
    if (!ex || !type) return [];

    const preview: { libelle: string }[] = [];
    const annee = parseInt(ex.annee);

    switch (type) {
      case 'mensuel': {
        const mois = [
          'Janvier',
          'Février',
          'Mars',
          'Avril',
          'Mai',
          'Juin',
          'Juillet',
          'Août',
          'Septembre',
          'Octobre',
          'Novembre',
          'Décembre',
        ];
        mois.forEach((m) => preview.push({ libelle: `${m} ${annee}` }));
        break;
      }
      case 'trimestriel':
        [1, 2, 3, 4].forEach((t) =>
          preview.push({ libelle: `T${t} ${annee}` }),
        );
        break;
      case 'semestriel':
        preview.push({ libelle: `1er semestre ${annee}` });
        preview.push({ libelle: `2ème semestre ${annee}` });
        break;
      case 'annuel':
        preview.push({ libelle: `Année ${annee}` });
        break;
    }
    return preview;
  });
}
