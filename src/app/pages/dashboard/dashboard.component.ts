import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardData, DashboardFilters } from '../../services/dashboard.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AbsPipe } from '../../abs.pipe';
import { Router } from '@angular/router';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AbsPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(true);
  selectedPeriode = signal<string>('mois');
  showCustomDatePicker = signal<boolean>(false);
  dateDebut: string = '';
  dateFin: string = '';
  filters: DashboardFilters = {
    periode: 'mois'
  };
  selectedEmployeId = signal<string>('');

  private charts: { [key: string]: Chart } = {};
  Math: any;

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.dashboardService.getDashboardData(this.filters).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        // console.log(this.dashboardData());
        this.isLoading.set(false);
        setTimeout(() => {
          this.createCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du dashboard:', error);
        this.isLoading.set(false);
      }
    });
  }

  onPeriodeChange(periode: string): void {
    this.selectedPeriode.set(periode);

    // Si "personnalise" est sélectionné, afficher le sélecteur de dates
    if (periode === 'personnalise') {
      this.showCustomDatePicker.set(true);
      this.filters.periode = 'personnalise';
      // Ne pas charger tant que les dates ne sont pas validées
    } else {
      this.showCustomDatePicker.set(false);
      this.filters.periode = periode as any;
      // Supprimer les dates personnalisées
      delete this.filters.date_debut;
      delete this.filters.date_fin;
      this.dateDebut = '';
      this.dateFin = '';
      this.loadDashboard();
    }
  }

  onEmployeChange(employeId: string): void {
    this.selectedEmployeId.set(employeId);

    if (employeId) {
      this.filters.employe_id = employeId;
    } else {
      delete this.filters.employe_id;
    }

    this.loadDashboard();
  }

  get selectedEmployeNom(): string | null {
    const data = this.dashboardData();
    const slug = this.selectedEmployeId();

    if (!data || !slug) return null;

    const employe = data.liste_employes.find(e => e.slug === slug);
    return employe ? employe.nom_complet : null;
  }


  onCustomDateChange(): void {
    if (this.dateDebut && this.dateFin) {
      // Valider que date début < date fin
      if (new Date(this.dateDebut) > new Date(this.dateFin)) {
        alert('La date de début doit être antérieure à la date de fin');
        return;
      }

      this.filters.date_debut = this.dateDebut;
      this.filters.date_fin = this.dateFin;
      this.loadDashboard();
    }
  }

  resetCustomDates(): void {
    this.dateDebut = '';
    this.dateFin = '';
    delete this.filters.date_debut;
    delete this.filters.date_fin;
    this.showCustomDatePicker.set(false);
    this.selectedPeriode.set('mois');
    this.filters.periode = 'mois';
    this.loadDashboard();
  }

  resetAllFilters(): void {
    this.selectedPeriode.set('mois');
    this.selectedEmployeId.set('');
    this.dateDebut = '';
    this.dateFin = '';
    this.showCustomDatePicker.set(false);

    this.filters = {
      periode: 'mois'
    };

    this.loadDashboard();
  }

  createCharts(): void {
    const data = this.dashboardData();
    if (!data) return;

    // Détruire les graphiques existants
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};

    // Graphique d'évolution
    this.createEvolutionChart(data);

    // Graphique de l'evolution des congés et aussi des type des congés
    this.createEvolutionCongesChart(data);
    this.createRepartitionTypesCongesChart(data);

    // Graphique de répartition par statut (Donut)
    this.createStatutChart(data);

    // Graphique de répartition par type (Bar)
    this.createTypeChart(data);

    // Graphique de répartition par services
    this.createServiceChart(data);
    // Graphique de répartition par genre
    this.createGenreChart(data);
    // Graphiques des demandes d'explication
    this.createEvolutionExplicationsChart(data);
    // Graphique de répartition par objet des demandes d'explication
    this.createRepartitionExplicationsObjetChart(data);
    // Graphiques des sanctions
    this.createEvolutionSanctionsChart(data);
    // Graphique de répartition par type des sanctions
    this.createRepartitionSanctionsTypeChart(data);


  }

  getTopCongeBarWidth(employe: any): number {
    const data = this.dashboardData();
    if (!data || !data.top_conges || data.top_conges.length === 0) return 0;

    const maxJours = Math.max(...data.top_conges.map(e => e.total_jours || 0));
    if (maxJours === 0) return 0;

    const totalJours = employe?.total_jours || 0;
    return (totalJours / maxJours) * 100;
  }

  getTopCongeColor(index: number): string {
    const colors = [
      '#4CAF50', // 1er - Vert
      '#8BC34A', // 2e - Vert clair
      '#CDDC39', // 3e - Jaune-vert
      '#FFC107', // 4e - Jaune
      '#FF9800', // 5e - Orange
      '#FF5722', // 6e - Orange foncé
      '#F44336', // 7e - Rouge
      '#E91E63', // 8e - Rose
      '#9C27B0', // 9e - Violet
      '#673AB7'  // 10e - Violet foncé
    ];
    return colors[index] || '#9E9E9E';
  }

  getSoldeIcon(solde: number): string {
    if (solde < 0) return '❌';
    if (solde < 5) return '⚠️';
    if (solde < 10) return 'ℹ️';
    return '✅';
  }

  /**
   * Statut du solde
   */
  getSoldeStatus(solde: number): string {
    if (solde < 0) return 'danger';
    if (solde < 5) return 'warning';
    if (solde < 10) return 'info';
    return 'success';
  }

  getSoldeLabel(solde: number): string {
    if (solde < 0) return 'Négatif';
    if (solde < 5) return 'Critique';
    if (solde < 10) return 'Faible';
    return 'Normal';
  }

  getAlerteIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'warning': '⚠️',
      'info': 'ℹ️',
      'error': '❌',
      'success': '✅'
    };
    return icons[type] || 'ℹ️';
  }

  //
  getTopEmployeBarWidth(employe: any): number {
    const data = this.dashboardData();
    if (!data || data.top_employes.length === 0) return 0;

    const maxMinutes = data.top_employes[0].total_minutes;
    if (maxMinutes === 0) return 0;

    return (employe.total_minutes / maxMinutes) * 100;
  }

  /**
   * Obtient une couleur dégradée selon le rang
   */
  getTopEmployeColor(index: number): string {
    const colors = [
      '#4CAF50', // 1er - Vert
      '#8BC34A', // 2e - Vert clair
      '#CDDC39', // 3e - Jaune-vert
      '#FFC107', // 4e - Jaune
      '#FF9800', // 5e - Orange
      '#FF5722', // 6e - Orange foncé
      '#F44336', // 7e - Rouge
      '#E91E63', // 8e - Rose
      '#9C27B0', // 9e - Violet
      '#673AB7'  // 10e - Violet foncé
    ];
    return colors[index] || '#9E9E9E';
  }

  createEvolutionChart(data: DashboardData): void {
    const canvas = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: data.evolution.map(e => e.periode),
        datasets: [
          {
            label: 'Total',
            data: data.evolution.map(e => e.total),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Approuvées',
            data: data.evolution.map(e => e.approuvees),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Refusées',
            data: data.evolution.map(e => e.refusees),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.charts['evolution'] = new Chart(ctx, config);
  }

  createStatutChart(data: DashboardData): void {
    const canvas = document.getElementById('statutChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: data.repartition_statuts.map(s => s.statut),
        datasets: [{
          data: data.repartition_statuts.map(s => s.total),
          backgroundColor: data.repartition_statuts.map(s => s.couleur),
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
      }
    };

    this.charts['statut'] = new Chart(ctx, config);
  }

  createTypeChart(data: DashboardData): void {
    const canvas = document.getElementById('typeChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.repartition_types.map(t => t.type),
        datasets: [{
          label: 'Nombre de demandes',
          data: data.repartition_types.map(t => t.total),
          backgroundColor: '#8B5CF6',
          borderRadius: 8,
          barThickness: 40
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          y: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.charts['type'] = new Chart(ctx, config);
  }

  createServiceChart(data: DashboardData): void {
    const canvas = document.getElementById('serviceChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.repartition_services.map(s => s.service),
        datasets: [
          {
            label: 'Approuvées',
            data: data.repartition_services.map(s => s.approuvees),
            backgroundColor: '#10B981',
            borderRadius: 6,
          },
          {
            label: 'En attente',
            data: data.repartition_services.map(s => s.en_attente),
            backgroundColor: '#F59E0B',
            borderRadius: 6,
          },
          {
            label: 'Refusées',
            data: data.repartition_services.map(s => s.refusees),
            backgroundColor: '#EF4444',
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => {
                  return sum + (item.parsed?.y ?? 0);
                }, 0);

                return 'Total: ' + total;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    };

    this.charts['service'] = new Chart(ctx, config);
  }

  createGenreChart(data: DashboardData): void {
    const canvas = document.getElementById('genreChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.repartition_genres.map(g => g.genre),
        datasets: [
          {
            label: 'Approuvées',
            data: data.repartition_genres.map(g => g.approuvees),
            backgroundColor: '#10B981',
            borderRadius: 6,
          },
          {
            label: 'En attente',
            data: data.repartition_genres.map(g => g.en_attente),
            backgroundColor: '#F59E0B',
            borderRadius: 6,
          },
          {
            label: 'Refusées',
            data: data.repartition_genres.map(g => g.refusees),
            backgroundColor: '#EF4444',
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => {
                  return sum + (item.parsed.y || 0);
                }, 0);
                return 'Total: ' + total;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    };

    this.charts['genre'] = new Chart(ctx, config);
  }

  getNiveauCouleur(niveau: string): string {
    const couleurs: { [key: string]: string } = {
      'faible': '#D1FAE5',
      'moyen': '#FEF3C7',
      'eleve': '#FED7AA',
      'tres_eleve': '#FEE2E2'
    };
    return couleurs[niveau] || '#F3F4F6';
  }

  getAlerteCouleur(type: string): string {
    const couleurs: { [key: string]: string } = {
      'warning': '#FEF3C7',
      'info': '#DBEAFE',
      'error': '#FEE2E2',
      'success': '#D1FAE5'
    };
    return couleurs[type] || '#F3F4F6';
  }

  createEvolutionExplicationsChart(data: DashboardData): void {
    const canvas = document.getElementById('evolutionExplicationsChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vérifier si des données existent
    if (!data.evolution_explications || data.evolution_explications.length === 0) {
      this.showNoDataMessage('evolutionExplicationsChart', 'Aucune donnée d\'évolution disponible');
      return;
    }

    // S'assurer que les données sont des nombres
    const evolutionData = data.evolution_explications.map(e => ({
      periode: e.periode,
      total: Number(e.total) || 0,
      en_attente: Number(e.en_attente) || 0,
      repondues: Number(e.repondues) || 0,
      sanctionnees: Number(e.sanctionnees) || 0,
    }));

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: evolutionData.map(e => e.periode),
        datasets: [
          {
            label: 'Total',
            data: evolutionData.map(e => e.total),
            borderColor: '#3B82F6',  // Même couleur que le total des permissions
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'En attente',
            data: evolutionData.map(e => e.en_attente),
            borderColor: '#F59E0B',  // Même couleur que "En attente"
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Répondues',
            data: evolutionData.map(e => e.repondues),
            borderColor: '#10B981',  // Même couleur que "Approuvées"
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.charts['evolutionExplications'] = new Chart(ctx, config);
  }

  /**
   * Crée le graphique de répartition par objet des demandes d'explication
   */
  createRepartitionExplicationsObjetChart(data: DashboardData): void {
    const canvas = document.getElementById('repartitionExplicationsObjetChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vérifier si des données existent
    if (!data.repartition_explications_par_objet || data.repartition_explications_par_objet.length === 0) {
      this.showNoDataMessage('repartitionExplicationsObjetChart', 'Aucune donnée de répartition disponible');
      return;
    }

    // Palette de couleurs
    const colors = [
      '#8B5CF6', // Violet
      '#3B82F6', // Bleu
      '#10B981', // Vert
      '#F59E0B', // Orange
      '#EF4444', // Rouge
      '#EC4899', // Rose
      '#6366F1', // Indigo
      '#14B8A6', // Cyan
    ];

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: data.repartition_explications_par_objet.map(item => item.objet),
        datasets: [{
          label: 'Nombre de demandes d\'explication',
          data: data.repartition_explications_par_objet.map(item => item.total),
          backgroundColor: data.repartition_explications_par_objet.map((_, index) =>
            colors[index % colors.length]
          ),
          borderRadius: 8,
          barThickness: 40
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed.x} demande(s)`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          y: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11
              }
            }
          }
        }
      }
    };

    this.charts['repartitionExplicationsObjet'] = new Chart(ctx, config);
  }

  getDelaiClass(delaiJours: number): string {
    if (delaiJours === null || delaiJours === undefined) return 'badge-secondary';
    if (delaiJours < 0) return 'badge-danger';
    if (delaiJours <= 3) return 'badge-success';
    if (delaiJours <= 7) return 'badge-warning';
    return 'badge-info';
  }

  getDelaiIcon(delaiJours: number): string {
    if (delaiJours === null || delaiJours === undefined) return 'fa fa-minus';
    if (delaiJours < 0) return 'fa fa-exclamation-triangle';
    if (delaiJours <= 3) return 'fa fa-check-circle';
    if (delaiJours <= 7) return 'fa fa-clock';
    return 'fa fa-calendar-check';
  }

  formatDelaiCourt(delaiJours: number): string {
    if (delaiJours === null || delaiJours === undefined) return '-';

    const absDelai = Math.abs(delaiJours);
    const jours = Math.floor(absDelai);
    const heures = Math.round((absDelai - jours) * 24);

    let result = '';
    if (jours > 0) {
      result += `${jours}j `;
    }
    if (heures > 0) {
      result += `${heures}h`;
    }

    if (jours === 0 && heures === 0) {
      result = '0j';
    }

    // Ajouter un indicateur de sévérité pour les retards
    if (delaiJours < 0) {
      const retardAbs = Math.abs(delaiJours);
      if (retardAbs > 90) {
        result = '🔴 ' + result + ' (CRITIQUE)';
      } else if (retardAbs > 30) {
        result = '🟠 ' + result + ' (Important)';
      } else {
        result = '🟡 ' + result;
      }
    } else {
      if (delaiJours <= 3) {
        result = '✅ ' + result + ' (Rapide)';
      } else if (delaiJours <= 7) {
        result = '✅ ' + result;
      } else {
        result = '📅 ' + result;
      }
    }

    return result;
  }

  getDelaiPourcentage(delaiJours: number): number {
    // Ajuster l'échelle pour les très grands nombres
    const absDelai = Math.abs(delaiJours);
    let pourcentage;

    if (absDelai <= 30) {
      pourcentage = (absDelai / 30) * 100;
    } else if (absDelai <= 90) {
      pourcentage = 100 + (absDelai - 30) / 60 * 50; // 100% à 150%
    } else {
      pourcentage = 150 + Math.min((absDelai - 90) / 10 * 5, 50); // 150% à 200%
    }

    return Math.min(pourcentage, 200);
  }

  getDelaiCategorie(delaiJours: number): string {
    if (delaiJours === null || delaiJours === undefined) return 'inconnu';

    if (delaiJours < 0) {
      const retard = Math.abs(delaiJours);
      if (retard > 90) return 'retard-critique';
      if (retard > 30) return 'retard-important';
      return 'retard';
    }

    if (delaiJours > 30) return 'delai-anormal';
    if (delaiJours <= 3) return 'delai-rapide';
    return 'delai-normal';
  }

  formatDelaiAvecCategorie(delaiJours: number): string {
    if (delaiJours === null || delaiJours === undefined) return '-';

    const absDelai = Math.abs(delaiJours);
    const jours = Math.floor(absDelai);
    const heures = Math.round((absDelai - jours) * 24);
    const texteDelai = `${jours}j ${heures}h`;

    const categorie = this.getDelaiCategorie(delaiJours);

    switch(categorie) {
      case 'retard-critique':
        return `🔴 RETARD CRITIQUE ${texteDelai}`;
      case 'retard-important':
        return `🟠 RETARD IMPORTANT ${texteDelai}`;
      case 'retard':
        return `🟡 RETARD ${texteDelai}`;
      case 'delai-anormal':
        return `⚠️ DÉLAI ANORMAL ${texteDelai}`;
      case 'delai-rapide':
        return `✅ DÉLAI RAPIDE ${texteDelai}`;
      case 'delai-normal':
        return `✅ DÉLAI ${texteDelai}`;
      default:
        return texteDelai;
    }
  }

  getDelaiBadgeClass(delaiJours: number): string {
    const categorie = this.getDelaiCategorie(delaiJours);

    switch(categorie) {
      case 'retard-critique': return 'badge-retard-critique';
      case 'retard-important': return 'badge-retard-important';
      case 'retard': return 'badge-retard';
      case 'delai-anormal': return 'badge-delai-anormal';
      case 'delai-rapide': return 'badge-delai-rapide';
      case 'delai-normal': return 'badge-delai-normal';
      default: return 'badge-secondary';
    }
  }

  // ============================================
  // GRAPHIQUES DES SANCTIONS
  // ============================================

  /**
   * Crée le graphique d'évolution des sanctions
   */
  createEvolutionSanctionsChart(data: DashboardData): void {
    const canvas = document.getElementById('evolutionSanctionsChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vérifier si des données existent
    if (!data.evolution_sanctions || data.evolution_sanctions.length === 0) {
      this.showNoDataMessage('evolutionSanctionsChart', 'Aucune donnée d\'évolution disponible');
      return;
    }

    // S'assurer que les données sont des nombres
    const evolutionData = data.evolution_sanctions.map(e => ({
      periode: e.periode,
      total: Number(e.total) || 0,
      avertissement: Number(e.avertissement) || 0,
      blame: Number(e.blame) || 0,
      suspension: Number(e.suspension) || 0,
      licenciement: Number(e.licenciement) || 0,
    }));

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: evolutionData.map(e => e.periode),
        datasets: [
          {
            label: 'Total',
            data: evolutionData.map(e => e.total),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Avertissement',
            data: evolutionData.map(e => e.avertissement),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Blâme',
            data: evolutionData.map(e => e.blame),
            borderColor: '#F97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Suspension',
            data: evolutionData.map(e => e.suspension),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Licenciement',
            data: evolutionData.map(e => e.licenciement),
            borderColor: '#DC2626',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.charts['evolutionSanctions'] = new Chart(ctx, config);
  }

  /**
   * Crée le graphique de répartition des sanctions par type
   */
  createRepartitionSanctionsTypeChart(data: DashboardData): void {
    const canvas = document.getElementById('repartitionSanctionsTypeChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Vérifier si des données existent
    if (!data.repartition_sanctions_par_type || data.repartition_sanctions_par_type.length === 0) {
      this.showNoDataMessage('repartitionSanctionsTypeChart', 'Aucune donnée de répartition disponible');
      return;
    }

    // Filtrer les types avec total > 0
    const filteredData = data.repartition_sanctions_par_type.filter(item => item.total > 0);

    if (filteredData.length === 0) {
      this.showNoDataMessage('repartitionSanctionsTypeChart', 'Aucune sanction enregistrée');
      return;
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: filteredData.map(item => item.type_label),
        datasets: [{
          data: filteredData.map(item => item.total),
          backgroundColor: filteredData.map(item => item.couleur),
          borderWidth: 2,
          borderColor: '#fff',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.charts['repartitionSanctionsType'] = new Chart(ctx, config);
  }

  /**
   * Affiche un message "aucune donnée" sur un canvas
   */
  showNoDataMessage(canvasId: string, message: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Afficher un message
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  }

//   createEvolutionCongesChart(data: DashboardData): void {
//   const canvas = document.getElementById('evolutionCongesChart') as HTMLCanvasElement;
//   if (!canvas) return;

//   const ctx = canvas.getContext('2d');
//   if (!ctx) return;

//   // Vérifier si des données existent
//   if (!data.evolution_conges || data.evolution_conges.length === 0) {
//     this.showNoDataMessage('evolutionCongesChart', 'Aucune donnée d\'évolution des congés disponible');
//     return;
//   }

//   // Vérifier si les données ont des valeurs
//   const hasTotal = data.evolution_conges.some(e => (e.total || 0) > 0);
//   if (!hasTotal) {
//     this.showNoDataMessage('evolutionCongesChart', 'Aucune donnée de congés disponible pour cette période');
//     return;
//   }

//   const config: ChartConfiguration = {
//     type: 'line',
//     data: {
//       labels: data.evolution_conges.map(e => e.periode),
//       datasets: [
//         {
//           label: 'Total',
//           data: data.evolution_conges.map(e => e.total || 0), 
//           borderColor: '#8B5CF6',
//           backgroundColor: 'rgba(139, 92, 246, 0.1)',
//           tension: 0.4,
//           fill: true,
//           borderWidth: 3
//         },
//         {
//           label: 'Approuvées',
//           data: data.evolution_conges.map(e => e.approuvees || 0), 
//           borderColor: '#10B981',
//           backgroundColor: 'rgba(16, 185, 129, 0.1)',
//           tension: 0.4,
//           fill: true,
//           borderWidth: 2
//         },
//         {
//           label: 'En attente',
//           data: data.evolution_conges.map(e => e.en_attente || 0), 
//           borderColor: '#F59E0B',
//           backgroundColor: 'rgba(245, 158, 11, 0.1)',
//           tension: 0.4,
//           fill: true,
//           borderWidth: 2,
//           borderDash: [5, 5]
//         },
//         {
//           label: 'Refusées',
//           data: data.evolution_conges.map(e => e.refusees || 0), // Convertir undefined en 0
//           borderColor: '#EF4444',
//           backgroundColor: 'rgba(239, 68, 68, 0.1)',
//           tension: 0.4,
//           fill: true,
//           borderWidth: 2
//         }
//       ]
//     },
//     options: {
//       responsive: true,
//       maintainAspectRatio: false,
//       plugins: {
//         legend: {
//           position: 'top',
//           labels: {
//             usePointStyle: true,
//             padding: 15,
//             font: { 
//               size: 12,
//               weight: 'bold'
//             },
//             boxWidth: 12
//           }
//         },
//         tooltip: {
//           mode: 'index',
//           intersect: false,
//           backgroundColor: 'rgba(0, 0, 0, 0.8)',
//           padding: 12,
//           cornerRadius: 8,
//           callbacks: {
//             label: function(context) {
//               let label = context.dataset.label || '';
//               let value = context.parsed.y || 0;
//               return `${label}: ${value} jour(s)`;
//             }
//           }
//         }
//       },
//       scales: {
//         y: {
//           beginAtZero: true,
//           grid: {
//             color: 'rgba(0, 0, 0, 0.05)'
//           },
//           ticks: {
//             stepSize: 1,
//             callback: function(value) {
//               return value + ' j';
//             }
//           }
//         },
//         x: {
//           grid: {
//             display: false
//           }
//         }
//       },
//       interaction: {
//         mode: 'index',
//         intersect: false
//       }
//     }
//   };

//   this.charts['evolutionConges'] = new Chart(ctx, config);
// }

createEvolutionCongesChart(data: DashboardData): void {
  const canvas = document.getElementById('evolutionCongesChart') as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Utiliser evolution_conges ou evolution
  const evolutionData = data.evolution_conges && data.evolution_conges.length > 0 
    ? data.evolution_conges 
    : data.evolution;

  if (!evolutionData || evolutionData.length === 0) {
    this.showNoDataMessage('evolutionCongesChart', 'Aucune donnée d\'évolution disponible');
    return;
  }

  // Vérifier si les données ont des valeurs
  const hasData = evolutionData.some((e: any) => {
    const total = e.total || e.total_jours || 0;
    return total > 0;
  });

  if (!hasData) {
    this.showNoDataMessage('evolutionCongesChart', 'Aucune donnée de congés disponible');
    return;
  }

  // Préparer les labels
  const labels = evolutionData.map((e: any) => e.periode);

  // Préparer les datasets
  const datasets: any[] = [];

  // Total jours (priorité à total_jours, puis total)
  const totalData = evolutionData.map((e: any) => e.total_jours || e.total || 0);
  if (totalData.some((v: number) => v > 0)) {
    datasets.push({
      label: 'Total jours',
      data: totalData,
      borderColor: '#8B5CF6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 3
    });
  }

  // Total demandes
  const demandesData = evolutionData.map((e: any) => e.total_demandes || 0);
  if (demandesData.some((v: number) => v > 0)) {
    datasets.push({
      label: 'Total demandes',
      data: demandesData,
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      tension: 0.4,
      fill: true,
      borderWidth: 2,
      borderDash: [5, 5]
    });
  }

  // Si aucun dataset n'a été ajouté
  if (datasets.length === 0) {
    this.showNoDataMessage('evolutionCongesChart', 'Aucune donnée de congés disponible');
    return;
  }

  const config: any = {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { 
              size: 12,
              weight: 'bold'
            },
            boxWidth: 12
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context: any) {
              let label = context.dataset.label || '';
              let value = context.parsed.y || 0;
              let unite = label.includes('demandes') ? 'demande(s)' : 'jour(s)';
              return `${label}: ${value} ${unite}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            stepSize: 1,
            callback: function(value: any) {
              return value;
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      }
    }
  };

  this.charts['evolutionConges'] = new Chart(ctx, config);
}

  createRepartitionTypesCongesChart(data: DashboardData): void {
  const canvas = document.getElementById('repartitionTypesCongesChart') as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Vérifier si des données existent
  if (!data.repartition_par_type_conge || data.repartition_par_type_conge.length === 0) {
    this.showNoDataMessage('repartitionTypesCongesChart', 'Aucune donnée de répartition des congés disponible');
    return;
  }

  // Filtrer les types avec total_jours > 0 (au lieu de total)
  const filteredData = data.repartition_par_type_conge.filter(item => item.total_jours > 0);
  if (filteredData.length === 0) {
    this.showNoDataMessage('repartitionTypesCongesChart', 'Aucun congé enregistré');
    return;
  }

  const colors = [
    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#EC4899', '#6366F1', '#14B8A6', '#F472B6', '#34D399'
  ];

  // Trier par ordre décroissant selon total_jours
  const sortedData = [...filteredData].sort((a, b) => b.total_jours - a.total_jours);
  const total = sortedData.reduce((sum, item) => sum + item.total_jours, 0);

  // Vérifier si le total est > 0
  if (total === 0) {
    this.showNoDataMessage('repartitionTypesCongesChart', 'Aucun jour de congé enregistré');
    return;
  }

  const config: ChartConfiguration = {
    type: 'doughnut',
    data: {
      // Utiliser type_nom au lieu de type
      labels: sortedData.map(item => 
        `${item.type_nom} (${item.total_jours} - ${((item.total_jours / total) * 100).toFixed(1)}%)`
      ),
      datasets: [{
        // Utiliser total_jours au lieu de total
        data: sortedData.map(item => item.total_jours),
        backgroundColor: sortedData.map((_, index) => colors[index % colors.length]),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 15
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: 'bold'
            },
            boxWidth: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          padding: 14,
          cornerRadius: 10,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const dataset = context.dataset;
              const total = (dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label.split('(')[0].trim()}: ${value} jour(s) (${percentage}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  } as any;

  this.charts['repartitionTypesConges'] = new Chart(ctx, config);
}


  openDemandeListe(){
    this.router.navigate(['permissions']);
  }

  openDemandeExplicationsDetails(demandeSlug: string){
    this.router.navigate(['explications', demandeSlug ]);
  }

  openSanctionListe(){
    this.router.navigate(['sanctions']);
  }


  ngOnDestroy(): void {
    // Nettoyer les graphiques
    Object.values(this.charts).forEach(chart => chart.destroy());
  }
}
