import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  BureauStat,
  DashboardData,
  EvolutionUnifiee,
  MODE_PAIEMENT_ICONS,
  MODE_PAIEMENT_LABELS,
  ModePaiement,
} from '../../../models/Caisse/dashboard.model';
import { DashboardCaisseService } from '../../../services/Caisse/dashboard-caisse.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-dashboard-caisse',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, LoaderComponent],
  templateUrl: './dashboard-caisse.component.html',
  styleUrl: './dashboard-caisse.component.scss',
})
export class DashboardCaisseComponent implements OnInit {
  private dashboardService = inject(DashboardCaisseService);

  //  État 
  isLoading = signal(true);
  data = signal<DashboardData | null>(null);
  error = signal<string | null>(null);

  //  Computed 
  soldePositif = computed(() => (this.data()?.kpis.solde ?? 0) >= 0);

  evolutionUnifiee = computed((): EvolutionUnifiee[] => {
    const d = this.data();
    if (!d) return [];

    const map = new Map<string, { depenses: number; recouvrements: number }>();

    d.evolution_depenses.forEach((e) => {
      map.set(e.mois, { depenses: Number(e.total), recouvrements: 0 });
    });
    d.evolution_recouvrements.forEach((e) => {
      const ex = map.get(e.mois);
      if (ex) ex.recouvrements = Number(e.total);
      else map.set(e.mois, { depenses: 0, recouvrements: Number(e.total) });
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, v]) => ({
        mois,
        depenses: v.depenses,
        recouvrements: v.recouvrements,
        solde: v.recouvrements - v.depenses,
      }));
  });

  //  Labels 
  readonly modePaiementLabels = MODE_PAIEMENT_LABELS;
  readonly modePaiementIcons = MODE_PAIEMENT_ICONS;
  readonly Math = Math;

  //  Lifecycle 
  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.dashboardService.getOverview().subscribe({
      next: (d) => {
        this.data.set(d);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Impossible de charger le tableau de bord.',
        );
        this.isLoading.set(false);
      },
    });
  }

  //  Helpers 
  formatMois(mois: string): string {
    const moisFr = [
      '',
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jun',
      'Jul',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];
    const [annee, num] = mois.split('-');
    return `${moisFr[parseInt(num)]} ${annee}`;
  }

  pct(valeur: number, total: number): number {
    if (!total) return 0;
    return Math.round((valeur / total) * 100);
  }

  nomClient(c: any): string {
    return `${c?.nom ?? ''} ${c?.prenom ?? ''}`.trim() || '—';
  }

  labelMode(mode: ModePaiement | null): string {
    if (!mode) return '—';
    return this.modePaiementLabels[mode] ?? mode;
  }

  iconMode(mode: ModePaiement | null): string {
    if (!mode) return 'fa-question';
    return this.modePaiementIcons[mode] ?? 'fa-credit-card';
  }

  soldeClass(solde: number): string {
    return solde >= 0 ? 'text-success' : 'text-danger';
  }

  soldePrefix(solde: number): string {
    return solde >= 0 ? '+' : '';
  }

  // Retourne le nombre d'opérations pour un mois donné dans l'évolution
  nbMois(evolution: { mois: string; nombre: number }[], mois: string): number {
    return evolution.find((e) => e.mois === mois)?.nombre ?? 0;
  }
}
