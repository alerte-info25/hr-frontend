import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployesService } from '../../services/employes.service';
import { Subscription, finalize } from 'rxjs';
import { MaterialModule } from '../../../../../../material.module';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Employe {
  id?: number;
  rh_slug: string;
  matricule: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  email_professionnel: string;
  photo_url: string | null;
  bureau_slug: string | null;
  service_nom: string;
  fonction_nom: string;
  role_nom: string;
  is_actif: boolean;
  synced_at: string;
  created_at?: string;
  updated_at?: string;
  bureau?: {
    id: number;
    acronyme: string;
    slug: string;
    nom: string;
  };
}
@Component({
  selector: 'app-list-employes',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './list-employes.component.html',
  styleUrl: './list-employes.component.scss'
})
export class ListEmployesComponent {
  employes: Employe[] = [];
  filteredEmployes: Employe[] = [];
  selectedEmploye: Employe | null = null;
  isLoading = false;
  isSyncing = false;
  searchTerm = '';
  filterActif = 'all'; // 'all', 'actif', 'inactif'
  showModal = false;
  currentPage = 1;
  itemsPerPage = 12;
  totalPages = 1;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private employesService: EmployesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEmployes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadEmployes(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.employesService.getAll().pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (data) => {
          this.employes = data;
          this.applyFilters();
        },
        error: (error) => {
          console.error('Erreur lors du chargement des employés:', error);
          this.showError('Impossible de charger la liste des employés');
        }
      })
    );
  }

  syncEmployes(): void {
    this.isSyncing = true;
    this.subscriptions.add(
      this.employesService.sync().pipe(
        finalize(() => this.isSyncing = false)
      ).subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Synchronisation lancée avec succès');
            // Recharger après un délai pour laisser le temps à la synchro
            setTimeout(() => this.loadEmployes(), 3000);
          } else {
            this.showError(response.message || 'Erreur lors de la synchronisation');
          }
        },
        error: (error) => {
          console.error('Erreur lors de la synchronisation:', error);
          this.showError('Impossible de lancer la synchronisation');
        }
      })
    );
  }

  applyFilters(): void {
    let filtered = [...this.employes];

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.nom_complet.toLowerCase().includes(term) ||
        emp.matricule?.toLowerCase().includes(term) ||
        emp.email_professionnel?.toLowerCase().includes(term) ||
        emp.service_nom?.toLowerCase().includes(term)
      );
    }

    // Filtre par statut actif/inactif
    if (this.filterActif !== 'all') {
      filtered = filtered.filter(emp =>
        this.filterActif === 'actif' ? emp.is_actif : !emp.is_actif
      );
    }

    // Pagination
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.filteredEmployes = filtered.slice(start, end);

    // Réinitialiser la page si elle dépasse le nombre total
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
      this.applyFilters();
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  openDetails(employe: Employe): void {
    this.selectedEmploye = employe;
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.showModal = false;
    document.body.style.overflow = '';
    setTimeout(() => {
      this.selectedEmploye = null;
    }, 300);
  }

  getStatusClass(isActif: boolean): string {
    return isActif ? 'status-active' : 'status-inactive';
  }

  getStatusText(isActif: boolean): string {
    return isActif ? 'Actif' : 'Inactif';
  }

  formatDate(date: string): string {
    if (!date) return 'Non défini';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitials(nomComplet: string): string {
    return nomComplet
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message,'Fermer',{
      duration: 3000,
      panelClass: ['toast-success']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['toast-error']
     });
  }

}
