import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SanctionService } from '../../services/sanction.service';
import { EmployesService } from '../../services/employes.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../loading/loading.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-sanctions',
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './sanctions.component.html',
  styleUrl: './sanctions.component.scss'
})
export class SanctionsComponent {

isLoading = true;
  sanctions: any[] = [];
  employes: any[] = [];

  // Filtres
  filterType = 'all';
  filterEmploye = 'all';
  searchTerm = '';

  // Types de sanctions
  typesSanctions = [
    { value: 'avertissement', label: 'Avertissement', color: 'type-warning' },
    { value: 'blame', label: 'Blâme', color: 'type-blame' },
    { value: 'mise_a_pied', label: 'Mise à pied', color: 'type-suspension' },
    { value: 'retrogradation', label: 'Rétrogradation', color: 'type-demotion' },
    { value: 'licenciement', label: 'Licenciement', color: 'type-dismissal' },
  ];

  // Modal de détails
  showDetailsModal = false;
  selectedSanction: any | null = null;

  // Modal de confirmation de suppression
  showDeleteModal = false;
  sanctionToDelete: any | null = null;

  constructor(
    private sanctionService: SanctionService,
    private employeService: EmployesService,
    private snackBar: MatSnackBar,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSanctions();
    this.loadEmployes();
  }

  loadSanctions(): void {
    this.isLoading = true;
    this.sanctionService.getAllSanction().subscribe({
      next: (data) => {
        this.sanctions = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors du chargement des sanctions',
          'Fermer',
          { duration: 4000, verticalPosition: 'top' }
        );
      }
    });
  }

  loadEmployes(): void {
    this.employeService.getList().subscribe({
      next: (data) => {
        this.employes = data;
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors du chargement des employés',
          'Fermer',
          { duration: 4000, verticalPosition: 'top' }
        );
      }
    });
  }

  get filteredSanctions(): any[] {
    if (!Array.isArray(this.sanctions)) {
      return [];
    }

    const term = this.searchTerm?.toLowerCase() || '';

    return this.sanctions.filter(s => {
      // Filtre par type
      const matchesType =
        this.filterType === 'all' || s.type === this.filterType;

      // Filtre par employé
      const matchesEmploye =
        this.filterEmploye === 'all' || s.employe?.slug === this.filterEmploye;

      // Recherche textuelle
      const matchesSearch =
        term === '' ||
        s.employe?.nom?.toLowerCase().includes(term) ||
        s.employe?.prenom?.toLowerCase().includes(term) ||
        s.type?.toLowerCase().includes(term) ||
        s.motif?.toLowerCase().includes(term) ||
        s.demande?.objet?.libelle?.toLowerCase().includes(term);

      return matchesType && matchesEmploye && matchesSearch;
    });
  }

  // Statistiques
  get totalSanctions(): number {
    return Array.isArray(this.sanctions) ? this.sanctions.length : 0;
  }

  get sanctionsByType(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};

    this.typesSanctions.forEach(type => {
      counts[type.value] = this.sanctions.filter(s => s.type === type.value).length;
    });

    return counts;
  }

  get employesWithSanctions(): number {
    const uniqueEmployes = new Set(this.sanctions.map(s => s.employe?.slug));
    return uniqueEmployes.size;
  }

  // Utilitaires
  getTypeConfig(type: string): any {
    return this.typesSanctions.find(t => t.value === type) || {
      value: type,
      label: type,
      color: 'type-default'
    };
  }

  getInitiales(employe: any): string {
    if (!employe) return '?';
    const prenom = employe.prenom || '';
    const nom = employe.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Modal détails
  openDetailsModal(sanction: any): void {
    this.selectedSanction = sanction;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedSanction = null;
  }

  // Modal suppression
  openDeleteModal(sanction: any): void {
    this.sanctionToDelete = sanction;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.sanctionToDelete = null;
  }

  confirmDelete(): void {
    if (!this.sanctionToDelete) return;

    this.isLoading = true;
    this.sanctionService.deleteSanction(this.sanctionToDelete.slug).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open(
          res.message || 'Sanction supprimée avec succès',
          'Fermer',
          { duration: 3000, verticalPosition: 'top' }
        );
        this.closeDeleteModal();
        this.loadSanctions();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la suppression',
          'Fermer',
          { duration: 4000, verticalPosition: 'top' }
        );
      }
    });
  }

  // Navigation
  voirDemande(demandeSlug: string): void {
    this.router.navigate(['/detail-demande', demandeSlug]);
  }

  voirEmploye(employeSlug: string): void {
    this.router.navigate(['/detail-employe', employeSlug]);
  }

  // Permissions
  isDRHOrDG(): boolean {
    return this.auth.isDG();
  }

  canDeleteSanction(): boolean {
    return this.auth.isDG();
  }

  // Export
  exportToCSV(): void {
    const headers = ['Date', 'Employé', 'Type', 'Motif', 'Objet'];
    const rows = this.filteredSanctions.map(s => [
      this.formatDate(s.date_sanction),
      `${s.employe?.prenom} ${s.employe?.nom}`,
      this.getTypeConfig(s.type).label,
      s.motif,
      s.demande?.objet?.libelle || 'N/A'
    ]);

    let csvContent = headers.join(';') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(';') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sanctions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.snackBar.open('Export CSV réussi', 'Fermer', { duration: 2000 });
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterType = 'all';
    this.filterEmploye = 'all';
    this.searchTerm = '';
  }
}
