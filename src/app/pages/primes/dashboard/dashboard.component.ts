import { Component, OnInit } from '@angular/core';
import { PrimeService, Dashboard } from '../../services/prime.service';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

Chart.register(...registerables);

 @Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardPrimeComponent implements OnInit {
  dashboard: Dashboard | null = null;
  loading = true;
  error: string | null = null;

  // Charts
  evolutionChart: any;
  modesChart: any;
  projetsChart: any;

  constructor(private primeService: PrimeService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.primeService.getDashboard().subscribe({
      next: (response) => {
          this.dashboard = response;
          setTimeout(() => {
            this.initCharts();
          }, 100);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur de recuperation:', error);
        this.error = 'Erreur lors du chargement du tableau de bord';
        this.loading = false;
      }
    });
  }

  initCharts(): void {
    if (!this.dashboard) return;

    // Chart évolution des paiements
    this.createEvolutionChart();

    // Chart modes de paiement
    this.createModesChart();

    // Chart projets
    this.createProjetsChart();
  }

  createEvolutionChart(): void {
    const canvas = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboard) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.evolutionChart) {
      this.evolutionChart.destroy();
    }

    this.evolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.dashboard.evolution_paiements.map((item: any) =>
          new Date(item.date).toLocaleDateString('fr-FR')
        ),
        datasets: [{
          label: 'Montant des paiements',
          data: this.dashboard.evolution_paiements.map((item: any) => item.total),
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('fr-FR').format(value as number) + ' FCFA';
              }
            }
          }
        }
      }
    });
  }

  createModesChart(): void {
    const canvas = document.getElementById('modesChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboard) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.modesChart) {
      this.modesChart.destroy();
    }

    const modes = this.dashboard.paiements_par_mode;

    this.modesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: modes.map((item: any) => this.getModePaiementLabel(item.mode)),
        datasets: [{
          data: modes.map((item: any) => item.total),
          backgroundColor: [
            '#4F46E5',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  createProjetsChart(): void {
    const canvas = document.getElementById('projetsChart') as HTMLCanvasElement;
    if (!canvas || !this.dashboard) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.projetsChart) {
      this.projetsChart.destroy();
    }

    this.projetsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Annulés', 'En cours', 'Terminés'],
        datasets: [{
          label: 'Nombre de projets',
          data: [
            this.dashboard.projets.annules,
            this.dashboard.projets.en_cours,
            this.dashboard.projets.termines
          ],
          backgroundColor: [
            '#EF4444',
            '#F59E0B',
            '#10B981'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value) + ' FCFA';
  }

  getModePaiementLabel(mode: string): string {
    const labels: any = {
      'especes': 'Espèces',
      'virement': 'Virement',
      'cheque': 'Chèque',
      'mobile_money': 'Mobile Money'
    };
    return labels[mode] || mode;
  }

  getStatutBadgeClass(statut: string): string {
    if (!statut) return 'badge-secondary';
    const normalized = statut.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const classes: any = {
      'en_attente': 'bg-warning',
      'annule': 'bg-danger',
      'en_cours': 'bg-info',
      'termine': 'bg-success',
      'partiel': 'bg-warning',
      'paye': 'bg-success'
    };
    return classes[statut] || 'bg-secondary';
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      'en_attente': 'En attente',
      'annule': 'Annulé',
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'partiel': 'Partiel',
      'paye': 'Payé'
    };
    return labels[statut] || statut;
  }

  ngOnDestroy(): void {
    if (this.evolutionChart) this.evolutionChart.destroy();
    if (this.modesChart) this.modesChart.destroy();
    if (this.projetsChart) this.projetsChart.destroy();
  }

  getModeBadgeClass(mode: string): string {
    const classes: any = {
      'especes': 'bg-warning',
      'virement': 'bg-info',
      'cheque': 'bg-primary',
      'mobile_money': 'bg-success'
    };
    return classes[mode] || 'bg-secondary';
  }




}
