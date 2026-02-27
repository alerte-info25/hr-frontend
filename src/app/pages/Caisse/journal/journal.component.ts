import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OperationComptable } from '../../../models/Caisse/operation-comptable.model';
import { OperationComptableService } from '../../../services/Caisse/operation-comptable-service.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { BureauModel } from '../../../models/Caisse/bureau.model';
import { BureauService } from '../../../services/Caisse/bureau.service';

@Component({
  selector: 'app-journal',
  imports: [RouterLink, CommonModule, FormsModule, LoaderComponent],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.scss',
})
export class JournalComponent implements OnInit {
  private operationComptableService = inject(OperationComptableService);

  operations = signal<OperationComptable[]>([]);
  bureaus = signal<BureauModel[]>([]);
  bureauService = inject(BureauService);
  loader = signal(false);
  errorMessage = signal<string | null>(null);
  deleteRfk = signal<string | null>(null);

  // Filtres
  recherche = signal('');
  filtreStatut = signal('');
  filtreNature = signal('');
  filtreBureau = signal('');

  // Lignes (afficher/masquer les lignes d'une opération)
  expandedRfk = signal<string | null>(null);

  operationsFiltrees = computed(() => {
    let liste = this.operations();

    if (this.recherche().trim()) {
      const terme = this.recherche().toLowerCase();
      liste = liste.filter(
        (op) =>
          op.libelle.toLowerCase().includes(terme) ||
          op.numero.toLowerCase().includes(terme) ||
          op.bureau?.libelle.toLowerCase().includes(terme) ||
          op.nature_operation?.libelle.toLowerCase().includes(terme),
      );
    }

    if (this.filtreStatut()) {
      liste = liste.filter((op) => op.statut === this.filtreStatut());
    }

    if (this.filtreNature()) {
      liste = liste.filter(
        (op) => op.nature_operation?.libelle === this.filtreNature(),
      );
    }

    if (this.filtreBureau()) {
      liste = liste.filter((op) => op.bureau?.rfk === this.filtreBureau());
    }

    return liste;
  });

  private loadData(): void {
    this.loader.set(true);
    this.operationComptableService.getAll().subscribe({
      next: (data) => {
        this.operations.set(data);
        this.loader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur lors du chargement',
        );
        this.loader.set(false);
      },
    });
  }

  private loadBureau() {
    this.bureauService.getAll().subscribe({
      next: (bureau) => {
        this.bureaus.set(bureau);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
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

    this.operationComptableService.valider(rfk).subscribe({
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

    this.operationComptableService.annuler(rfk).subscribe({
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
    this.operationComptableService.delete(rfk).subscribe({
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

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(
      montant,
    );
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

  stats = computed(() => {
    const liste = this.operations();
    const totalDebit = liste.reduce((acc, op) => acc + this.totalDebit(op), 0);
    const totalCredit = liste.reduce(
      (acc, op) => acc + this.totalCredit(op),
      0,
    );

    return {
      nb_entrees: liste.filter(
        (op) => op.nature_operation?.libelle === 'entrée',
      ).length,
      nb_sorties: liste.filter(
        (op) => op.nature_operation?.libelle === 'sortie',
      ).length,
      nb_brouillons: liste.filter((op) => op.statut === 'brouillon').length,
      nb_validees: liste.filter((op) => op.statut === 'validee').length,
      nb_annulees: liste.filter((op) => op.statut === 'annulee').length,
      total_entrees: liste
        .filter((op) => op.nature_operation?.libelle === 'Entrée')
        .reduce((acc, op) => acc + this.totalDebit(op), 0),
      total_sorties: liste
        .filter((op) => op.nature_operation?.libelle === 'Sortie')
        .reduce((acc, op) => acc + this.totalCredit(op), 0),
      total_debit: totalDebit,
      total_credit: totalCredit,
      equilibre: Math.round(totalDebit * 100) === Math.round(totalCredit * 100),
    };
  });

  ngOnInit(): void {
    this.loadData();
    this.loadBureau();
  }
}
