import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardData, DashboardFilters } from '../../services/dashboard.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AbsPipe } from '../../abs.pipe';

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

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.dashboardService.getDashboardData(this.filters).subscribe({
      next: (data) => {
        this.dashboardData.set(data);
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

  // onPeriodeChange(periode: string): void {
  //   this.selectedPeriode.set(periode);
  //   this.filters.periode = periode as any;
  //   this.loadDashboard();
  // }

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

    // Graphique de répartition par statut (Donut)
    this.createStatutChart(data);

    // Graphique de répartition par type (Bar)
    this.createTypeChart(data);

    // Graphique de répartition par services
    this.createServiceChart(data);
    // Graphique de répartition par genre
    this.createGenreChart(data);
  }
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

  getAlerteIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'warning': '⚠️',
      'info': 'ℹ️',
      'error': '❌',
      'success': '✅'
    };
    return icons[type] || 'ℹ️';
  }

  ngOnDestroy(): void {
    // Nettoyer les graphiques
    Object.values(this.charts).forEach(chart => chart.destroy());
  }
}
