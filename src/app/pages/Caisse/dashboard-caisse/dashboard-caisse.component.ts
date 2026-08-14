import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DashboardData,
  EvolutionUnifiee,
  MODE_PAIEMENT_ICONS,
  MODE_PAIEMENT_LABELS,
  ModePaiement,
  TypeOperation,
  TYPE_OPERATION_LABELS,
  TYPE_OPERATION_COLORS,
} from '../../../models/Caisse/dashboard.model';
import { DashboardCaisseService } from '../../../services/Caisse/dashboard-caisse.service';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import { ExerciceModel } from '../../../models/Caisse/exercice-comptable.model';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-dashboard-caisse',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, FormsModule, LoaderComponent],
  templateUrl: './dashboard-caisse.component.html',
  styleUrl: './dashboard-caisse.component.scss',
})
export class DashboardCaisseComponent implements OnInit, AfterViewInit {
  private dashboardService = inject(DashboardCaisseService);
  private exerciceService = inject(ExerciceComptableService);
  private cdr = inject(ChangeDetectorRef);

  // États
  isLoading = signal(true);
  isLoadingExercices = signal(true);
  data = signal<DashboardData | null>(null);
  error = signal<string | null>(null);
  exercices = signal<ExerciceModel[]>([]);
  selectedExerciceRfk = signal<string | null>(null);

  // FILTRES
  selectedTypeOperation = signal<TypeOperation | ''>('');
  selectedAComptabiliser = signal<boolean | null>(null);

  // Computed
  soldePositif = computed(() => (this.data()?.kpis.solde ?? 0) >= 0);

  hasActiveFilters = computed(() => {
    return !!(
      this.selectedTypeOperation() || this.selectedAComptabiliser() !== null
    );
  });

  // Évolution unifiée sans doublons
  evolutionUnifiee = computed((): EvolutionUnifiee[] => {
    const d = this.data();
    if (!d) return [];

    const map = new Map<string, { depenses: number; recouvrements: number }>();

    // Ajouter les dépenses avec nettoyage des mois
    d.evolution_depenses.forEach((e) => {
      const moisClean = this.nettoyerMois(e.mois);
      if (!map.has(moisClean)) {
        map.set(moisClean, { depenses: 0, recouvrements: 0 });
      }
      const existing = map.get(moisClean)!;
      existing.depenses = Number(e.total);
    });

    // Ajouter les recouvrements avec nettoyage des mois
    d.evolution_recouvrements.forEach((e) => {
      const moisClean = this.nettoyerMois(e.mois);
      if (!map.has(moisClean)) {
        map.set(moisClean, { depenses: 0, recouvrements: 0 });
      }
      const existing = map.get(moisClean)!;
      existing.recouvrements = Number(e.total);
    });

    // Trier et formater
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, v]) => ({
        mois,
        depenses: v.depenses,
        recouvrements: v.recouvrements,
        solde: v.recouvrements - v.depenses,
      }));
  });

  maxDepense = computed(() => {
    const values = this.evolutionUnifiee().map((e) => e.depenses);
    const max = Math.max(...values, 0);
    return max > 0 ? max : 1;
  });

  maxRecouvrement = computed(() => {
    const values = this.evolutionUnifiee().map((e) => e.recouvrements);
    const max = Math.max(...values, 0);
    return max > 0 ? max : 1;
  });

  // Nettoyer les mois
  private nettoyerMois(mois: string): string {
    if (!mois) return '';

    // Si c'est "2026-01" → garder tel quel
    if (/^\d{4}-\d{2}$/.test(mois)) {
      return mois;
    }

    // Si c'est "Jan 2026" → convertir en "2026-01"
    const match = mois.match(/([A-Za-z]{3})\s+(\d{4})/);
    if (match) {
      const moisFr = [
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
      const moisIndex = moisFr.indexOf(match[1]);
      if (moisIndex !== -1) {
        const numMois = String(moisIndex + 1).padStart(2, '0');
        return `${match[2]}-${numMois}`;
      }
    }

    return mois;
  }

  // Statistiques par type d'opération
  statsParTypeOperation = computed(() => {
    const d = this.data();
    if (!d) return [];

    const stats: {
      [key: string]: { total: number; nombre: number; estInterne: boolean };
    } = {};

    // Parcourir les dépenses
    d.dernieres_depenses.forEach((dep) => {
      const type = dep.type_operation || 'non_defini';
      if (!stats[type]) {
        stats[type] = {
          total: 0,
          nombre: 0,
          estInterne: type !== 'courant' && type !== 'non_defini',
        };
      }
      stats[type].total += dep.montant;
      stats[type].nombre++;
    });

    // Parcourir les recouvrements
    d.derniers_recouvrements.forEach((rec) => {
      const type = rec.type_operation || 'non_defini';
      if (!stats[type]) {
        stats[type] = {
          total: 0,
          nombre: 0,
          estInterne: type !== 'courant' && type !== 'non_defini',
        };
      }
      stats[type].total += rec.montant;
      stats[type].nombre++;
    });

    const totalGeneral = Object.values(stats).reduce(
      (sum, s) => sum + s.total,
      0,
    );

    return Object.keys(stats)
      .map((key) => ({
        type: key,
        libelle: this.getTypeOperationLabel(key),
        couleur: this.getTypeOperationColor(key),
        total: stats[key].total,
        nombre: stats[key].nombre,
        pourcentage:
          totalGeneral > 0 ? (stats[key].total / totalGeneral) * 100 : 0,
        estInterne: stats[key].estInterne,
      }))
      .sort((a, b) => b.total - a.total);
  });

  // Statistiques de comptabilisation
  statsComptabilisation = computed(() => {
    const d = this.data();
    if (!d) return { comptabilisees: 0, nonComptabilisees: 0, total: 0 };

    let comptabilisees = 0;
    let nonComptabilisees = 0;

    d.dernieres_depenses.forEach((dep) => {
      if (dep.a_comptabiliser) comptabilisees++;
      else nonComptabilisees++;
    });

    d.derniers_recouvrements.forEach((rec) => {
      if (rec.a_comptabiliser) comptabilisees++;
      else nonComptabilisees++;
    });

    return {
      comptabilisees,
      nonComptabilisees,
      total: comptabilisees + nonComptabilisees,
    };
  });

  // Constantes
  readonly modePaiementLabels = MODE_PAIEMENT_LABELS;
  readonly modePaiementIcons = MODE_PAIEMENT_ICONS;
  readonly typeOperationLabels = TYPE_OPERATION_LABELS;
  readonly typeOperationColors = TYPE_OPERATION_COLORS;
  readonly Math = Math;

  // Types d'opérations pour le filtre
  readonly typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'courant', label: 'Opérations courantes' },
    { value: 'interne_banque_caisse', label: 'Retrait banque → Caisse' },
    { value: 'interne_caisse_banque', label: 'Dépôt caisse → Banque' },
    { value: 'interne_banque_banque', label: 'Virement entre comptes' },
  ];

  readonly comptabilisationOptions = [
    { value: null, label: 'Toutes les opérations' },
    { value: true, label: '✅ Comptabilisées uniquement' },
    { value: false, label: '⏸️ Non comptabilisées uniquement' },
  ];

  ngOnInit(): void {
    this.loadExercices();
  }

  ngAfterViewInit(): void {
    // Forcer une détection de changements après le rendu initial
    requestAnimationFrame(() => {
      this.cdr.detectChanges();
    });
  }

  // Méthode utilitaire pour forcer le refresh
  private forceRefresh(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }

  loadExercices(): void {
    this.isLoadingExercices.set(true);
    this.exerciceService.getAll({ per_page: 100 }).subscribe({
      next: (paginated) => {
        const list = paginated.data || [];
        this.exercices.set(list);
        const actif = list.find((ex) => ex.est_actif);
        if (actif) {
          this.selectedExerciceRfk.set(actif.rfk);
        } else if (list.length) {
          this.selectedExerciceRfk.set(list[0].rfk);
        }
        this.isLoadingExercices.set(false);
        this.load();
        this.forceRefresh();
      },
      error: () => {
        this.error.set('Impossible de charger la liste des exercices.');
        this.isLoadingExercices.set(false);
        this.load();
        this.forceRefresh();
      },
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.error.set(null);
    const rfk = this.selectedExerciceRfk();

    // Construire les filtres
    const filters: any = {};
    if (rfk) filters.exercice_rfk = rfk;
    if (this.selectedTypeOperation()) {
      filters.type_operation = this.selectedTypeOperation();
    }
    if (this.selectedAComptabiliser() !== null) {
      filters.a_comptabiliser = this.selectedAComptabiliser();
    }

    // Utiliser getDashboardData avec les filtres
    this.dashboardService.getDashboardData(filters).subscribe({
      next: (d) => {
        this.data.set(d);
        this.isLoading.set(false);
        // Forcer la détection des changements après chargement
        this.forceRefresh();
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ?? 'Impossible de charger le tableau de bord.',
        );
        this.isLoading.set(false);
        this.forceRefresh();
      },
    });
  }

  // Changement de l'exercice
  onExerciceChange(rfk: string): void {
    this.selectedExerciceRfk.set(rfk);
    this.load();
  }

  // Changement du type d'opération
  onTypeOperationChange(value: string): void {
    this.selectedTypeOperation.set(value as TypeOperation | '');
    this.load();
  }

  // Changement du filtre de comptabilisation
  onComptabilisationChange(value: string): void {
    if (value === '') {
      this.selectedAComptabiliser.set(null);
    } else {
      this.selectedAComptabiliser.set(value === 'true');
    }
    this.load();
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.selectedTypeOperation.set('');
    this.selectedAComptabiliser.set(null);
    this.load();
  }

  // Obtenir le libellé du type d'opération
  getTypeOperationLabel(type: string | null): string {
    if (!type || type === 'non_defini') return 'Non défini';
    return (
      this.typeOperationLabels[type as keyof typeof this.typeOperationLabels] ||
      type
    );
  }

  // Obtenir la couleur du type d'opération
  getTypeOperationColor(type: string | null): string {
    if (!type || type === 'non_defini') return '#9E9E9E';
    return (
      this.typeOperationColors[type as keyof typeof this.typeOperationColors] ||
      '#9E9E9E'
    );
  }

  // Formatage des mois
  formatMois(mois: string): string {
    if (!mois) return '—';

    const moisFr = [
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

    // Si le mois est au format "2026-01" ou "0026-01"
    if (mois.includes('-')) {
      const parts = mois.split('-');
      let annee = parts[0];
      const num = parseInt(parts[1]);

      // Si l'année commence par "00", la remplacer par "20"
      if (annee.startsWith('00')) {
        annee = '20' + annee.slice(2);
      }
      // Si l'année a moins de 4 chiffres, la compléter
      if (annee.length < 4) {
        annee = annee.padStart(4, '0').slice(0, 4);
      }

      if (num >= 1 && num <= 12) {
        return `${moisFr[num - 1]} ${annee}`;
      }
      return mois;
    }

    // Si le mois est au format "Jan 2026"
    const match = mois.match(/([A-Za-z]{3})\s+(\d+)/);
    if (match) {
      const moisNom = match[1];
      let annee = match[2];

      // Si l'année commence par "00", la remplacer par "20"
      if (annee.startsWith('00')) {
        annee = '20' + annee.slice(2);
      } else if (annee.length < 4) {
        annee = annee.padStart(4, '0').slice(0, 4);
      }

      return `${moisNom} ${annee}`;
    }

    return mois;
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

  nbMois(evolution: { mois: string; nombre: number }[], mois: string): number {
    return evolution.find((e) => e.mois === mois)?.nombre ?? 0;
  }
}
