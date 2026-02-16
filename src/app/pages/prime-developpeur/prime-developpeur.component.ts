import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { PrimeService } from '../services/prime.service';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../material.module';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MesPrimesData } from '../../models/MesPrimes.model';

Chart.register(...registerables);

interface Projet {
  projet: any;
  attribution: any;
  paiements: any[];
  nombre_paiements: number;
}

@Component({
  selector: 'app-prime-developpeur',
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './prime-developpeur.component.html',
  styleUrl: './prime-developpeur.component.scss'
})
export class PrimeDeveloppeurComponent implements OnInit, OnDestroy {

  // Données
  data: MesPrimesData | null = null;
  loading: boolean = true;
  error: string | null = null;
  user: any;

  // Charts
  evolutionChart: Chart | undefined;
  statutChart: Chart | undefined;
  modeChart: Chart | undefined;

  // Filtres et pagination
  selectedTab: 'projets' | 'paiements' | 'statistiques' = 'projets';
  searchTerm: string = '';
  itemsPerPage: number = 5;
  currentPage: number = 1;

  // Animation states
  statsAnimated: boolean = false;

  constructor(
    private primeService: PrimeService,
    private authSvr: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    this.loadMesPrimes();
  }

  loadMesPrimes(): void {
    this.loading = true;
    this.primeService.getMesPrimes(this.user?.employe.slug).subscribe({
      next: (response: any) => {
        this.data = response
        this.loading = false;

        // Animer les statistiques après un court délai
        setTimeout(() => {
          this.statsAnimated = true;
        }, 300);
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error(err);
      }
    });
  }

  // ⚠️ CORRECTION : Cette méthode doit être appelée depuis le HTML
  onTabChange(tab: 'projets' | 'paiements' | 'statistiques') {
    this.selectedTab = tab;

    // Détruire les anciens graphiques s'ils existent
    this.destroyCharts();

    if (tab === 'statistiques' && this.data) {
      // Attendre que le DOM soit rendu avant de créer les graphiques
      setTimeout(() => {
        this.createCharts();
      }, 100);
    }
  }

  destroyCharts(): void {
    if (this.evolutionChart) {
      this.evolutionChart.destroy();
      this.evolutionChart = undefined;
    }
    if (this.statutChart) {
      this.statutChart.destroy();
      this.statutChart = undefined;
    }
    if (this.modeChart) {
      this.modeChart.destroy();
      this.modeChart = undefined;
    }
  }

  createCharts(): void {
    if (!this.data) {
      console.error('Pas de données disponibles pour créer les graphiques');
      return;
    }

    // Vérifier que les canvas existent dans le DOM
    const evolutionCtx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    const statutCtx = document.getElementById('statutChart') as HTMLCanvasElement;
    const modeCtx = document.getElementById('modeChart') as HTMLCanvasElement;

    if (!evolutionCtx || !statutCtx || !modeCtx) {
      console.error('Les canvas ne sont pas encore dans le DOM');
      return;
    }

    console.log('Création des graphiques...');

    // Créer les graphiques
    this.createEvolutionChart();
    this.createStatutChart();
    this.createModeChart();
  }

  createEvolutionChart(): void {
    const ctx = document.getElementById('evolutionChart') as HTMLCanvasElement;
    if (!ctx || !this.data) {
      console.error('Canvas evolutionChart introuvable ou pas de données');
      return;
    }

    const labels = this.data.evolution_paiements.map(e => e.mois_label);
    const values = this.data.evolution_paiements.map(e => Number(e.total));

    console.log('Création graphique évolution avec labels:', labels, 'et values:', values);

    this.evolutionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Paiements reçus',
          data: values,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }]
      },
      options: {
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
            titleColor: '#fff',
            bodyColor: '#fff',
            callbacks: {
              label: (context) => {
                const value = context.parsed.y ?? 0;
                return `${value.toLocaleString('fr-FR')} FCFA`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: (value) => {
                return (value as number).toLocaleString('fr-FR');
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    console.log('Graphique évolution créé avec succès');
  }

  createStatutChart(): void {
    const ctx = document.getElementById('statutChart') as HTMLCanvasElement;
    if (!ctx || !this.data) {
      console.error('Canvas statutChart introuvable ou pas de données');
      return;
    }

    const repartition = this.data.repartition_par_statut;

    console.log('Création graphique statut avec données:', repartition);

    this.statutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['En attente', 'Partiel', 'Complète'],
        datasets: [{
          data: [
            repartition.en_attente.nombre,
            repartition.partiel.nombre,
            repartition.complete.nombre
          ],
          backgroundColor: [
            '#f59e0b',
            '#3b82f6',
            '#10b981'
          ],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
          }
        },
        cutout: '70%'
      }
    });

    console.log('Graphique statut créé avec succès');
  }

  createModeChart(): void {
    const ctx = document.getElementById('modeChart') as HTMLCanvasElement;
    if (!ctx || !this.data) {
      console.error('Canvas modeChart introuvable ou pas de données');
      return;
    }

    const labels = this.data.paiements_par_mode.map(m => this.getModeLabel(m.mode));
    const values = this.data.paiements_par_mode.map(m => Number(m.total));

    console.log('Création graphique mode avec labels:', labels, 'et values:', values);

    this.modeChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Montant total',
          data: values,
          backgroundColor: [
            '#8b5cf6',
            '#ec4899',
            '#f59e0b',
            '#10b981'
          ],
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
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
              label: (context) => {
                const value = context.parsed.y ?? 0;
                return `${value.toLocaleString('fr-FR')} FCFA`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: (value) => {
                return (value as number).toLocaleString('fr-FR');
              }
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });

    console.log('Graphique mode créé avec succès');
  }

  getModeLabel(mode: string): string {
    const modes: { [key: string]: string } = {
      'virement': 'Virement',
      'mobile_money': 'Mobile Money',
      'especes': 'Espèces',
      'cheque': 'Chèque'
    };
    return modes[mode] || mode;
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'en_cours': 'status-progress',
      'termine': 'status-success',
      'annule': 'status-error',
      'en_attente': 'status-warning',
      'partiel': 'status-info',
      'complete': 'status-success'
    };
    return classes[statut] || 'status-default';
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_cours': 'En cours',
      'termine': 'Terminé',
      'annule': 'Annulé',
      'en_attente': 'En attente',
      'partiel': 'Partiel',
      'complete': 'Complète'
    };
    return labels[statut] || statut;
  }

  getStatutIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'en_cours': 'pending',
      'termine': 'check_circle',
      'annule': 'cancel',
      'en_attente': 'schedule',
      'partiel': 'timelapse',
      'complete': 'check_circle'
    };
    return icons[statut] || 'info';
  }

  getModeIcon(mode: string): string {
    const icons: { [key: string]: string } = {
      'virement': 'account_balance',
      'mobile_money': 'smartphone',
      'especes': 'payments',
      'cheque': 'receipt'
    };
    return icons[mode] || 'payment';
  }

  get filteredProjets(): Projet[] {
    if (!this.data) return [];

    let projets = this.data.projets;

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      projets = projets.filter((p: Projet) =>
        p.projet.nom.toLowerCase().includes(term)
      );
    }

    return projets;
  }

  get paginatedProjets(): Projet[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredProjets.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProjets.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('fr-FR') + ' FCFA';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  ngOnDestroy(): void {
    // Détruire les charts pour éviter les fuites mémoire
    this.destroyCharts();
  }
}
