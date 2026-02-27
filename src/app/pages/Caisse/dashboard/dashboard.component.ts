import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

import { OperationComptableService } from '../../../services/Caisse/operation-comptable-service.service';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import { OperationComptable } from '../../../models/Caisse/operation-comptable.model';
import { ExerciceComptable } from '../../../models/Caisse/exercice-comptable.model';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private operationService = inject(OperationComptableService);
  private exerciceService = inject(ExerciceComptableService);

  @ViewChild('lineChart') lineChartRef!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  // Données brutes
  operations = signal<OperationComptable[]>([]);
  exerciceActif = signal<ExerciceComptable | null>(null);

  // États
  loader = signal(false);
  errorMessage = signal<string | null>(null);

  // Filtre période
  filtrePeriode = signal<'semaine' | 'mois' | 'trimestre'>('mois');

  constructor() {
    effect(() => {
      const data = this.evolutionMensuelle();
      if (data.length > 0) {
        setTimeout(() => this.renderChart(data), 0);
      }
    });
  }

  // Opérations filtrées par période
  operationsFiltrees = computed(() => {
    const maintenant = new Date();
    const ops = this.operations();

    return ops.filter((op) => {
      const date = new Date(op.date_operation);

      if (this.filtrePeriode() === 'semaine') {
        const debutSemaine = new Date(maintenant);
        debutSemaine.setDate(maintenant.getDate() - maintenant.getDay());
        debutSemaine.setHours(0, 0, 0, 0);
        return date >= debutSemaine;
      }

      if (this.filtrePeriode() === 'mois') {
        return (
          date.getMonth() === maintenant.getMonth() &&
          date.getFullYear() === maintenant.getFullYear()
        );
      }

      if (this.filtrePeriode() === 'trimestre') {
        const trimestreActuel = Math.floor(maintenant.getMonth() / 3);
        const trimestreOp = Math.floor(date.getMonth() / 3);
        return (
          trimestreOp === trimestreActuel &&
          date.getFullYear() === maintenant.getFullYear()
        );
      }

      return true;
    });
  });

  // ----------------------------------------------------------------
  // Stats — basées sur la période filtrée
  // ----------------------------------------------------------------
  stats = computed(() => {
    const ops = this.operationsFiltrees();
    const validees = ops.filter((op) => op.statut === 'validee');

    const entrees = validees.filter((op) =>
      op.nature_operation?.libelle?.toLowerCase().includes('entr'),
    );
    const sorties = validees.filter((op) =>
      op.nature_operation?.libelle?.toLowerCase().includes('sort'),
    );

    const totalEntrees = entrees.reduce(
      (acc, op) => acc + (this.totalDebit(op) || this.totalCredit(op)),
      0,
    );
    const totalSorties = sorties.reduce(
      (acc, op) => acc + (this.totalDebit(op) || this.totalCredit(op)),
      0,
    );

    return {
      total_entrees: totalEntrees,
      total_sorties: totalSorties,
      solde_net: totalEntrees - totalSorties,
      nb_ecritures: validees.length,
      nb_brouillons: ops.filter((op) => op.statut === 'brouillon').length,
      equilibre:
        Math.round(totalEntrees * 100) === Math.round(totalSorties * 100),
    };
  });

  // 5 dernières opérations validées — toutes périodes
  dernieresOperations = computed(() =>
    this.operations()
      .filter((op) => op.statut === 'validee')
      .sort(
        (a, b) =>
          new Date(b.date_operation).getTime() -
          new Date(a.date_operation).getTime(),
      ),
  );

  // Top 5 comptes — basés sur la période filtrée
  topComptes = computed(() => {
    const map = new Map<
      string,
      {
        numero: string;
        libelle: string;
        total_debit: number;
        total_credit: number;
      }
    >();

    this.operationsFiltrees()
      .filter((op) => op.statut === 'validee')
      .forEach((op) => {
        op.lignes.forEach((ligne) => {
          const key = ligne.compte?.rfk ?? '';
          if (!key) return;

          if (!map.has(key)) {
            map.set(key, {
              numero: ligne.compte!.numero,
              libelle: ligne.compte!.libelle,
              total_debit: 0,
              total_credit: 0,
            });
          }
          const e = map.get(key)!;
          e.total_debit += ligne.montant_debit ?? 0;
          e.total_credit += ligne.montant_credit ?? 0;
        });
      });

    return Array.from(map.values())
      .sort(
        (a, b) =>
          b.total_debit + b.total_credit - (a.total_debit + a.total_credit),
      )
      .slice(0, 5);
  });

  // Soldes comptes clés — basés sur la période filtrée
  soldesComptesCles = computed(() => {
    const numerosVises = ['512000', '530000', '411000', '401000', '445710'];
    const map = new Map<
      string,
      {
        numero: string;
        libelle: string;
        debit: number;
        credit: number;
      }
    >();

    this.operationsFiltrees()
      .filter((op) => op.statut === 'validee')
      .forEach((op) => {
        op.lignes.forEach((ligne) => {
          const num = ligne.compte?.numero ?? '';
          if (!numerosVises.includes(num)) return;

          if (!map.has(num)) {
            map.set(num, {
              numero: num,
              libelle: ligne.compte!.libelle,
              debit: 0,
              credit: 0,
            });
          }
          const e = map.get(num)!;
          e.debit += ligne.montant_debit ?? 0;
          e.credit += ligne.montant_credit ?? 0;
        });
      });

    return numerosVises
      .filter((n) => map.has(n))
      .map((n) => {
        const e = map.get(n)!;
        return { ...e, solde: e.debit - e.credit };
      });
  });

  // Évolution mensuelle — toutes périodes pour le graphique
  evolutionMensuelle = computed(() => {
    const map = new Map<
      string,
      {
        mois: string;
        entrees: number;
        sorties: number;
        nb_entrees: number;
        nb_sorties: number;
      }
    >();

    this.operations()
      .filter((op) => op.statut === 'validee')
      .forEach((op) => {
        const mois = op.date_operation.substring(0, 7);
        const nature = op.nature_operation?.libelle?.toLowerCase() ?? '';
        const montant = this.totalDebit(op) || this.totalCredit(op);

        if (!map.has(mois)) {
          map.set(mois, {
            mois,
            entrees: 0,
            sorties: 0,
            nb_entrees: 0,
            nb_sorties: 0,
          });
        }

        const e = map.get(mois)!;
        if (nature.includes('entr')) {
          e.entrees += montant;
          e.nb_entrees += 1;
        } else if (nature.includes('sort')) {
          e.sorties += montant;
          e.nb_sorties += 1;
        }
      });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  });

  // Max pour barres de progression
  maxSolde = computed(() => {
    const valeurs = this.soldesComptesCles().map((c) => Math.abs(c.solde));
    return Math.max(...valeurs, 1);
  });

  maxTopCompte = computed(() => {
    const valeurs = this.topComptes().map(
      (c) => c.total_debit + c.total_credit,
    );
    return Math.max(...valeurs, 1);
  });

  // ----------------------------------------------------------------
  // Cycle de vie
  // ----------------------------------------------------------------
  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loader.set(true);

    forkJoin({
      operations: this.operationService.getAll(),
      exercices: this.exerciceService.getAll(),
    }).subscribe({
      next: (data) => {
        this.operations.set(data.operations);
        const actif = data.exercices.find((e) => e.statut === 'ouvert') ?? null;
        this.exerciceActif.set(actif);
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

  // ----------------------------------------------------------------
  // Graphique Chart.js — Bar Entrées/Sorties + ligne solde net
  // ----------------------------------------------------------------
  private renderChart(
    data: {
      mois: string;
      entrees: number;
      sorties: number;
      nb_entrees: number;
      nb_sorties: number;
    }[],
  ): void {
    if (!this.lineChartRef?.nativeElement) return;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const labels = data.map((d) => this.formatMois(d.mois));
    const entrees = data.map((d) => d.entrees);
    const sorties = data.map((d) => d.sorties);
    const soldes = data.map((d) => d.entrees - d.sorties);

    this.chart = new Chart(this.lineChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Entrées (Fcfa)',
            data: entrees,
            backgroundColor: 'rgba(28, 200, 138, 0.8)',
            borderColor: '#1cc88a',
            borderWidth: 1,
            borderRadius: 4,
          } as any,
          {
            label: 'Sorties (Fcfa)',
            data: sorties,
            backgroundColor: 'rgba(231, 74, 59, 0.8)',
            borderColor: '#e74a3b',
            borderWidth: 1,
            borderRadius: 4,
          } as any,
          {
            label: 'Solde net (Fcfa)',
            data: soldes,
            type: 'line',
            borderColor: '#4e73df',
            backgroundColor: 'rgba(78,115,223,0.05)',
            borderWidth: 2.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: soldes.map((s) =>
              s >= 0 ? '#1cc88a' : '#e74a3b',
            ),
            fill: false,
            tension: 0.4,
          } as any,
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, padding: 16, font: { size: 13 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y as number;
                const signe = val >= 0 ? '+' : '';
                return ` ${ctx.dataset.label} : ${signe}${new Intl.NumberFormat('fr-FR').format(val)} Fcfa`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 12 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 12 },
              callback: (v) =>
                new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                  v as number,
                ),
            },
          },
        },
      },
    });
  }

  // ----------------------------------------------------------------
  // Utilitaires
  // ----------------------------------------------------------------
  totalDebit(op: OperationComptable): number {
    return op.lignes.reduce((acc, l) => acc + (l.montant_debit ?? 0), 0);
  }

  totalCredit(op: OperationComptable): number {
    return op.lignes.reduce((acc, l) => acc + (l.montant_credit ?? 0), 0);
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(
      montant,
    );
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getPourcentageSolde(valeur: number): number {
    return Math.min(
      Math.round((Math.abs(valeur) / this.maxSolde()) * 100),
      100,
    );
  }

  getPourcentageCompte(valeur: number): number {
    return Math.min(Math.round((valeur / this.maxTopCompte()) * 100), 100);
  }

  formatMois(moisStr: string): string {
    const [annee, mois] = moisStr.split('-');
    const labels: Record<string, string> = {
      '01': 'Jan',
      '02': 'Fév',
      '03': 'Mar',
      '04': 'Avr',
      '05': 'Mai',
      '06': 'Juin',
      '07': 'Jul',
      '08': 'Aoû',
      '09': 'Sep',
      '10': 'Oct',
      '11': 'Nov',
      '12': 'Déc',
    };
    return `${labels[mois] ?? mois} ${annee}`;
  }

  nbEntrees = computed(
    () =>
      this.operationsFiltrees().filter(
        (op) =>
          op.statut === 'validee' &&
          op.nature_operation?.libelle?.toLowerCase().includes('entr'),
      ).length,
  );

  nbSorties = computed(
    () =>
      this.operationsFiltrees().filter(
        (op) =>
          op.statut === 'validee' &&
          op.nature_operation?.libelle?.toLowerCase().includes('sort'),
      ).length,
  );
}
