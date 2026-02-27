import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ExerciceComptableService } from '../../../../services/Caisse/exercice-comptable.service';
import { OperationComptableService } from '../../../../services/Caisse/operation-comptable-service.service';
import { ExerciceComptable } from '../../../../models/Caisse/exercice-comptable.model';
import { OperationComptable } from '../../../../models/Caisse/operation-comptable.model';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-detail-exercice',
  imports: [CommonModule, RouterLink, FormsModule, LoaderComponent],
  templateUrl: './detail-exercice.component.html',
  styleUrl: './detail-exercice.component.scss',
})
export class DetailExerciceComponent implements OnInit {
  exerciceRfk = input.required<string>();

  private exerciceService = inject(ExerciceComptableService);
  private operationService = inject(OperationComptableService);
  private router = inject(Router);

  exercice = signal<ExerciceComptable | null>(null);
  operations = signal<OperationComptable[]>([]);

  // États
  loader = signal(false);
  loaderOps = signal(false);
  errorMessage = signal<string | null>(null);
  expandedRfk = signal<string | null>(null);
  deleteRfk = signal<string | null>(null);

  // Filtres
  recherche = signal('');
  filtreStatut = signal('');
  filtreNature = signal('');
  filtreMois = signal('');

  // operation filtrés
  operationsFiltrees = computed(() => {
    let liste = this.operations();

    // Filtre recherche texte
    const terme = this.recherche().trim().toLowerCase();
    if (terme) {
      liste = liste.filter(
        (op) =>
          op.libelle.toLowerCase().includes(terme) ||
          op.numero.toLowerCase().includes(terme) ||
          op.bureau?.libelle.toLowerCase().includes(terme),
      );
    }

    // Filtre statut
    if (this.filtreStatut()) {
      liste = liste.filter((op) => op.statut === this.filtreStatut());
    }

    // Filtre nature (entree / sortie)
    if (this.filtreNature()) {
      liste = liste.filter(
        (op) =>
          op.nature_operation?.libelle?.toLowerCase() === this.filtreNature(),
      );
    }

    // Filtre mois
    if (this.filtreMois()) {
      liste = liste.filter(
        (op) => op.date_operation.substring(5, 7) === this.filtreMois(),
      );
    }

    return liste;
  });

  // Stats calculées depuis toutes les opérations
  stats = computed(
    /**
     * au depart je prévoyais 3 status pour les opérations comptables (validée, brouillo, annulée) mais finalement j'ai décidé de laisser tomber cette logique
     * et donc toutes op est automatiquement validee
     * @returns {{ nb_operations: any; nb_brouillons: any; nb_validees: any; nb_annulees: any; total_debit: any; total_credit: any; resultat: number; equilibre: boolean; }}
     */
    () => {
      const liste = this.operations();
      const totalDebit = liste.reduce(
        (acc, op) => acc + this.totalDebit(op),
        0,
      );
      const totalCredit = liste.reduce(
        (acc, op) => acc + this.totalCredit(op),
        0,
      );

      return {
        nb_operations: liste.length,
        nb_brouillons: liste.filter((op) => op.statut === 'brouillon').length,
        nb_validees: liste.filter((op) => op.statut === 'validee').length,
        nb_annulees: liste.filter((op) => op.statut === 'annulee').length,
        total_debit: totalDebit,
        total_credit: totalCredit,
        resultat: totalCredit - totalDebit,
        equilibre:
          Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
      };
    },
  );

  // Analyse mensuelle calculée depuis toutes les opérations
  analyseParMois = computed(() => {
    const moisLabels: Record<string, string> = {
      '01': 'Janvier',
      '02': 'Février',
      '03': 'Mars',
      '04': 'Avril',
      '05': 'Mai',
      '06': 'Juin',
      '07': 'Juillet',
      '08': 'Août',
      '09': 'Septembre',
      '10': 'Octobre',
      '11': 'Novembre',
      '12': 'Décembre',
    };

    const map = new Map<
      string,
      {
        libelle: string;
        numero: string;
        nb_operations: number;
        total_debit: number;
        total_credit: number;
        solde: number;
      }
    >();

    this.operations().forEach((op) => {
      const mois = op.date_operation.substring(5, 7);
      if (!map.has(mois)) {
        map.set(mois, {
          libelle: moisLabels[mois],
          numero: mois,
          nb_operations: 0,
          total_debit: 0,
          total_credit: 0,
          solde: 0,
        });
      }
      const entry = map.get(mois)!;
      entry.nb_operations++;
      entry.total_debit += this.totalDebit(op);
      entry.total_credit += this.totalCredit(op);
      entry.solde = entry.total_debit - entry.total_credit;
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  });

  ngOnInit(): void {
    if (!this.exerciceRfk()) {
      this.router.navigate(['/caisse/exercices']);
      return;
    }

    this.loadExercice();
    this.loadOperations();
  }

  private loadExercice(): void {
    this.loader.set(true);
    this.exerciceService.getOne(this.exerciceRfk()).subscribe({
      next: (data) => {
        this.exercice.set(data);
        this.loader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? "Erreur lors du chargement de l'exercice",
        );
        this.loader.set(false);
      },
    });
  }

  private loadOperations(): void {
    this.loaderOps.set(true);
    this.operationService.getByExercice(this.exerciceRfk()).subscribe({
      next: (data) => {
        this.operations.set(data);
        this.loaderOps.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur lors du chargement des opérations',
        );
        this.loaderOps.set(false);
      },
    });
  }

  toggleLignes(rfk: string): void {
    this.expandedRfk.set(this.expandedRfk() === rfk ? null : rfk);
  }

  onValider(rfk: string): void {
    if (
      !confirm('Valider cette opération ? Elle ne pourra plus être modifiée.')
    )
      return;

    this.operationService.valider(rfk).subscribe({
      next: (data) => {
        this.operations.update((liste) =>
          liste.map((op) =>
            op.rfk === rfk ? { ...op, statut: data.statut } : op,
          ),
        );
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur lors de la validation',
        );
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  onAnnuler(rfk: string): void {
    if (!confirm('Annuler cette opération ?')) return;

    this.operationService.annuler(rfk).subscribe({
      next: (data) => {
        this.operations.update((liste) =>
          liste.map((op) =>
            op.rfk === rfk ? { ...op, statut: data.statut } : op,
          ),
        );
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? "Erreur lors de l'annulation",
        );
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  onDelete(rfk: string): void {
    if (!confirm('Supprimer cette opération ?')) return;

    this.deleteRfk.set(rfk);
    this.operationService.delete(rfk).subscribe({
      next: () => {
        this.operations.update((liste) => liste.filter((op) => op.rfk !== rfk));
        this.deleteRfk.set(null);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur lors de la suppression',
        );
        this.deleteRfk.set(null);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  totalDebit(operation: OperationComptable): number {
    return operation.lignes.reduce((acc, l) => acc + (l.montant_debit ?? 0), 0);
  }

  totalCredit(operation: OperationComptable): number {
    return operation.lignes.reduce(
      (acc, l) => acc + (l.montant_credit ?? 0),
      0,
    );
  }

  estEquilibree(operation: OperationComptable): boolean {
    return (
      Math.round(this.totalDebit(operation) * 100) ===
      Math.round(this.totalCredit(operation) * 100)
    );
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(
      montant,
    );
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  filtrerCeMois(): void {
    const mois = String(new Date().getMonth() + 1).padStart(2, '0');
    this.filtreMois.set(mois);
  }

  reinitialiserFiltres(): void {
    this.recherche.set('');
    this.filtreStatut.set('');
    this.filtreNature.set('');
    this.filtreMois.set('');
  }

  exportLoader = signal(false);

  onExportPdf(): void {
    if (!this.exercice()) return;

    this.exportLoader.set(true);

    this.operationService.exportExercicePdf(this.exerciceRfk()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.exercice()!.libelle}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportLoader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? "Erreur lors de l'export");
        this.exportLoader.set(false);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }
}
