import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExerciceComptableService } from '../../../../services/Caisse/exercice-comptable.service';
import { ExerciceStats } from '../../../../models/Caisse/exercice-comptable.model';

export interface Operation {
  rfk: string;
  date: string;
  nature: 'depense' | 'recouvrement';
  description: string;
  montant: number;
  mode_paiement: string;
  categorie: string;
  periode_rfk?: string;
}

@Component({
  selector: 'app-detail-exercice',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './detail-exercice.component.html',
  styleUrl: './detail-exercice.component.scss',
})
export class DetailExerciceComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private exerciceService = inject(ExerciceComptableService);

  //  State
  isLoading = signal(true);
  error = signal<string | null>(null);
  stats = signal<ExerciceStats | null>(null);

  // export
  exportLoading = signal(false);

  //  Filtres
  filterNature = '';
  filterPeriode = '';
  filterMode = '';
  filterSearch = '';

  //  Opérations fusionnées (dépenses + recouvrements)
  private allOperations = signal<Operation[]>([]);

  operations = computed<Operation[]>(() => {
    let ops = this.allOperations();

    if (this.filterNature) {
      ops = ops.filter((o) => o.nature === this.filterNature);
    }

    if (this.filterPeriode) {
      ops = ops.filter((o) => o.periode_rfk === this.filterPeriode);
    }

    if (this.filterMode) {
      ops = ops.filter((o) => o.mode_paiement === this.filterMode);
    }

    if (this.filterSearch.trim()) {
      const q = this.filterSearch.toLowerCase();
      ops = ops.filter(
        (o) =>
          o.description?.toLowerCase().includes(q) ||
          o.rfk?.toLowerCase().includes(q) ||
          o.categorie?.toLowerCase().includes(q),
      );
    }

    return ops;
  });

  totalDepensesFiltre = computed(() =>
    this.operations()
      .filter((o) => o.nature === 'depense')
      .reduce((sum, o) => sum + o.montant, 0),
  );

  totalRecouvrementsFiltres = computed(() =>
    this.operations()
      .filter((o) => o.nature === 'recouvrement')
      .reduce((sum, o) => sum + o.montant, 0),
  );

  soldePositif = computed(() => {
    const s = this.stats();
    if (!s) return false;
    return s.solde >= 0;
  });

  //  Lifecycle
  ngOnInit(): void {
    const rfk = this.route.snapshot.paramMap.get('rfk');
    if (!rfk) {
      this.router.navigate(['/caisse/exercices']);
      return;
    }
    this.loadStats(rfk);
  }

  private loadStats(rfk: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.exerciceService.getStats(rfk).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.buildOperations(stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ||
            "Impossible de charger les détails de l'exercice.",
        );
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Fusionne dépenses et recouvrements en une liste unifiée
   * triée par date décroissante.
   */
  private buildOperations(stats: ExerciceStats): void {
    const depenses: Operation[] = (stats.depenses ?? []).map((d: any) => ({
      rfk: d.rfk,
      date: d.date_depense,
      nature: 'depense' as const,
      description: d.description ?? '',
      montant: Number(d.montant),
      mode_paiement: d.mode_paiement,
      categorie: d.type_depense?.libelle ?? '—',
      periode_rfk: d.periode?.rfk ?? undefined,
    }));

    const recouvrements: Operation[] = (stats.recouvrements ?? []).map(
      (r: any) => ({
        rfk: r.rfk,
        date: r.date_recouvrement,
        nature: 'recouvrement' as const,
        description: r.description ?? '',
        montant: Number(r.montant),
        mode_paiement: r.mode_paiement,
        categorie: r.service_propose?.nom ?? '—',
        periode_rfk: r.periode?.rfk ?? undefined,
      }),
    );

    const merged = [...depenses, ...recouvrements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    this.allOperations.set(merged);
  }

  //  Actions filtres
  // Méthode déclenchée par (change) et (input) depuis le template
  applyFilters(): void {
    // Les computed signals se réévaluent automatiquement
    // On force la mise à jour en réassignant allOperations
    this.allOperations.set([...this.allOperations()]);
  }

  setNature(nature: string): void {
    this.filterNature = nature;
    this.applyFilters();
  }

  //  Clôture exercice
  cloturer(): void {
    const s = this.stats();
    if (!s?.exercice?.rfk) return;

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir clôturer l'exercice ${s.exercice.annee} ?\nCette action est irréversible.`,
    );
    if (!confirmed) return;

    this.exerciceService.cloturer(s.exercice.rfk).subscribe({
      next: () => {
        this.loadStats(s.exercice.rfk);
      },
      error: (err) => {
        alert(
          err?.error?.message ?? "Erreur lors de la clôture de l'exercice.",
        );
      },
    });
  }

  onExportPdf(): void {
    const rfk = this.stats()?.exercice?.rfk;
    if (!rfk) return;

    this.exportLoading.set(true);

    this.exerciceService.exportPdf(rfk).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `exercice-${this.stats()?.exercice?.annee}-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportLoading.set(false);
      },
      error: () => {
        this.error.set("Erreur lors de l'export PDF.");
        this.exportLoading.set(false);
      },
    });
  }
}
