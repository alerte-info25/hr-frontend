import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed, effect, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
import { MaterialModule } from '../../../../../../material.module';
import { AuthService } from '../../../../services/auth.service';
import { InfrasDashboardService, DashboardStats, BureauStats, CategorieStats, MouvementRecent, TopEmploye, AlerteGarantie, FiltresDashboard } from '../../services/infras-dashboard.service';

@Component({
  selector: 'app-infras-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './infras-dashboard.component.html',
  styleUrl: './infras-dashboard.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class InfrasDashboardComponent implements OnInit {

  private dashboardSvr = inject(InfrasDashboardService);
  private snackBar = inject(MatSnackBar);
  private authSvr = inject(AuthService);
  private router = inject(Router);

  isLoading = signal<boolean>(true);
  isDG = signal<boolean>(false);
  selectedYear = signal<number>(new Date().getFullYear());

  // Filtres
  filtres = signal<FiltresDashboard>({});
  bureaux = signal<any[]>([]);
  employes = signal<any[]>([]);
  showFilters = signal<boolean>(false);

  // Données
  stats = signal<DashboardStats | null>(null);
  bureauStats = signal<BureauStats[]>([]);
  categorieStats = signal<CategorieStats[]>([]);
  mouvementsRecents = signal<MouvementRecent[]>([]);
  topEmployes = signal<TopEmploye[]>([]);
  alertesGarantie = signal<AlerteGarantie[]>([]);
  evolutionMensuelle = signal<any[]>([]);

  // Tooltip
  tooltipVisible = signal<boolean>(false);
  tooltipData = signal<any>(null);
  tooltipPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  alertesCritiques = computed(() => {
    return this.alertesGarantie().filter(a => a.jours_restants <= 30);
  });

  tauxOccupationGlobal = computed(() => {
    const s = this.stats();
    if (!s || s.totalEquipements === 0) return 0;
    return Math.round((s.affectes / s.totalEquipements) * 100);
  });

  maxValue = computed(() => {
    const data = this.evolutionMensuelle();
    if (!data || data.length === 0) return 10;
    const max = Math.max(...data.map(m => m.total || 0));
    return max > 0 ? Math.ceil(max / 10) * 10 : 10;
  });

  // Nombre de filtres actifs
  nbFiltresActifs = computed(() => {
    const f = this.filtres();
    let count = 0;
    if (f.date_debut) count++;
    if (f.date_fin) count++;
    if (f.bureau_slug) count++;
    if (f.employe_slug) count++;
    return count;
  });

  constructor() {
    effect(() => {
      this.loadEvolution(this.selectedYear());
    });
  }

  ngOnInit(): void {
    this.isDG.set(this.authSvr.isDG());
    this.loadBureaux();
    this.loadEmployes();
    this.loadAllData();
  }

  loadBureaux(): void {
    this.dashboardSvr.getBureaux().subscribe({
      next: (data) => this.bureaux.set(data),
      error: () => this.snackBar.open('Erreur chargement des bureaux', 'Fermer', { duration: 3000 })
    });
  }

  loadEmployes(): void {
    this.dashboardSvr.getEmployes().subscribe({
      next: (data) => this.employes.set(data),
      error: () => this.snackBar.open('Erreur chargement des employés', 'Fermer', { duration: 3000 })
    });
  }

  loadAllData(): void {
    this.isLoading.set(true);

    Promise.all([
      this.loadStats(),
      this.loadBureauStats(),
      this.loadCategorieStats(),
      this.loadMouvementsRecents(),
      this.loadTopEmployes(),
      this.loadAlertesGarantie(),
      this.loadEvolution(this.selectedYear())
    ]).finally(() => {
      this.isLoading.set(false);
    });
  }

  loadStats(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getStats(this.filtres()).subscribe({
        next: (data) => {
          this.stats.set(data);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement des statistiques', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  loadBureauStats(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getStatsByBureau(this.filtres()).subscribe({
        next: (data) => {
          this.bureauStats.set(data);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement des statistiques par bureau', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  loadCategorieStats(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getStatsByCategorie(this.filtres()).subscribe({
        next: (data) => {
          this.categorieStats.set(data);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement des statistiques par catégorie', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  loadMouvementsRecents(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getMouvementsRecents(10, this.filtres()).subscribe({
        next: (data) => {
          this.mouvementsRecents.set(data);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement des mouvements récents', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  loadTopEmployes(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getTopEmployes(5, this.filtres()).subscribe({
        next: (data) => {
          this.topEmployes.set(data);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement du top employés', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  loadAlertesGarantie(): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getAlertesGarantie(this.filtres()).subscribe({
        next: (data) => {
          this.alertesGarantie.set(data);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement des alertes garantie', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  loadEvolution(annee: number): Promise<void> {
    return new Promise((resolve) => {
      this.dashboardSvr.getEvolutionMensuelle(annee, this.filtres()).subscribe({
        next: (data) => {
          const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
          const dataWithLabels = data.map((item) => ({
            ...item,
            moisLabel: moisLabels[item.mois - 1] || ''
          }));
          this.evolutionMensuelle.set(dataWithLabels);
          resolve();
        },
        error: () => {
          this.snackBar.open('Erreur chargement de l\'évolution mensuelle', 'Fermer', { duration: 3000 });
          resolve();
        }
      });
    });
  }

  updateFiltre(key: string, value: any): void {
    const currentFiltres = this.filtres();
    this.filtres.set({
      ...currentFiltres,
      [key]: value
    });
  }

  appliquerFiltres(): void {
    this.loadAllData();
    this.showFilters.set(false);
    this.snackBar.open('Filtres appliqués ✅', 'Fermer', { duration: 2000 });
  }

  resetFiltres(): void {
    this.filtres.set({});
    this.loadAllData();
    this.snackBar.open('Filtres réinitialisés', 'Fermer', { duration: 2000 });
  }

  toggleFilters(): void {
    this.showFilters.set(!this.showFilters());
  }

  getBureauNom(slug: string): string {
    const bureau = this.bureaux().find(b => b.slug === slug || b.rh_slug === slug);
    return bureau?.acronyme || bureau?.nom || slug || 'Tous';
  }

  getEmployeNom(slug: string): string {
    const employe = this.employes().find(e => e.slug === slug || e.rh_slug === slug);
    return employe?.nom_complet || employe?.nom || slug || 'Tous';
  }

  // Méthodes pour le graphique
  getGridValues(): number[] {
    const max = this.maxValue();
    const step = Math.max(1, Math.round(max / 4));
    return [0, step, step * 2, step * 3, max];
  }

  getTotalByType(type: 'sorties' | 'retours' | 'reformes'): number {
    return this.evolutionMensuelle().reduce((sum, item) => sum + (item[type] || 0), 0);
  }

  getTotalMouvements(): number {
    return this.evolutionMensuelle().reduce((sum, item) => sum + (item.total || 0), 0);
  }

  showTooltip(event: MouseEvent, item: any): void {
    this.tooltipData.set(item);
    this.tooltipPosition.set({
      x: event.clientX + 15,
      y: event.clientY - 20
    });
    this.tooltipVisible.set(true);
  }

  hideTooltip(): void {
    this.tooltipVisible.set(false);
    this.tooltipData.set(null);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.tooltipVisible()) {
      this.tooltipPosition.set({
        x: event.clientX + 15,
        y: event.clientY - 20
      });
    }
  }

  // Méthodes utilitaires
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'sortie_terrain': 'logout',
      'retour_terrain': 'login',
      'reforme': 'delete_forever',
      'transfert': 'swap_horiz',
      'mise_en_maintenance': 'build'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'sortie_terrain': 'Sortie terrain',
      'retour_terrain': 'Retour terrain',
      'reforme': 'Hors service',
      'transfert': 'Transfert',
      'mise_en_maintenance': 'Maintenance'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'sortie_terrain': 'type-sortie',
      'retour_terrain': 'type-retour',
      'reforme': 'type-reforme'
    };
    return classes[type] || '';
  }

  getAlerteLabel(jours: number): string {
    if (jours <= 0) return '⚠️ Garantie expirée';
    if (jours <= 30) return `🔴 ${jours} jours restants`;
    if (jours <= 90) return `🟡 ${jours} jours restants`;
    return `🟢 ${jours} jours restants`;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  refresh(): void {
    this.loadAllData();
  }

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
