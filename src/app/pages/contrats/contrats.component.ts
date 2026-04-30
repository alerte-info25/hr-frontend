import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContratService } from '../../services/contrat.service';
import { TypeContratService } from '../../services/type-contrat.service';
import { EmployesService } from '../../services/employes.service';
import { LoadingComponent } from '../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { FormContratDialogComponent } from '../dialog/form-contrat-dialog/form-contrat-dialog.component';

@Component({
  selector: 'app-contrats',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    LoadingComponent,
    ConfirmDeleteDialogComponent,
  ],
  templateUrl: './contrats.component.html',
  styleUrl: './contrats.component.scss',
})
export class ContratsComponent implements OnInit {
  showConfirmModal = false;
  itemToDelete: any = null;
  contrats: any[] = [];
  Typecontrats: any[] = [];
  isLoading = true;
  contratsFiltered: any[] = [];
  togglingSlug: string | null = null; // slug du contrat en cours de toggle

  searchFilters = {
    employeNom: '',
    type: '',
    numero: '',
    statut: '',
  };

  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  totalContrats = 0;
  nombreCDI = 0;
  nombreCDD = 0;
  nombreStagiaire = 0;
  nombreInterim = 0;
  nombreFreelance = 0;
  nombreExpires = 0;
  nombreEnAlerte = 0;

  constructor(
    private dialog: MatDialog,
    private contratSvr: ContratService,
    private typecontratSvr: TypeContratService,
    private employeSvr: EmployesService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.isLoading = true;
    this.contratSvr.getList().subscribe({
      next: (data) => {
        this.contrats = data;
        this.isLoading = false;
        this.contratsFiltered = [...this.contrats];
        this.calculateStats();
        this.updatePagination();
      },
      error: (err) => {
        console.error('Erreur de chargement des contrats', err);
        this.isLoading = false;
        this.snackBar.open('Erreur de chargement des contrats', 'Fermer', {
          duration: 3000,
        });
      },
    });

    this.typecontratSvr.getList().subscribe({
      next: (data) => {
        this.Typecontrats = data;
      },
      error: (err) => {
        console.error('Erreur types contrats', err);
      },
    });
  }

  calculateStats() {
    this.totalContrats = this.contrats.length;
    this.nombreCDI = this.contrats.filter((c) => c.type?.nom === 'CDI').length;
    this.nombreCDD = this.contrats.filter((c) => c.type?.nom === 'CDD').length;
    this.nombreStagiaire = this.contrats.filter(
      (c) => c.type?.nom === 'STAGE',
    ).length;
    this.nombreInterim = this.contrats.filter(
      (c) => c.type?.nom === 'INTERIM',
    ).length;
    this.nombreFreelance = this.contrats.filter(
      (c) => c.type?.nom === 'FREELANCE',
    ).length;
    this.nombreExpires = this.contrats.filter((c) =>
      this.isContractExpired(c),
    ).length;
    this.nombreEnAlerte = this.contrats.filter(
      (c) =>
        this.getJoursRestants(c) !== null &&
        this.getJoursRestants(c)! <= 7 &&
        !this.isContractExpired(c),
    ).length;
  }

  applyFilters() {
    this.contratsFiltered = this.contrats.filter((contrat) => {
      return (
        (!this.searchFilters.employeNom ||
          contrat.employe?.nom
            ?.toLowerCase()
            .includes(this.searchFilters.employeNom.toLowerCase()) ||
          contrat.employe?.prenom
            ?.toLowerCase()
            .includes(this.searchFilters.employeNom.toLowerCase())) &&
        (!this.searchFilters.type ||
          contrat.type?.nom?.toLowerCase() ===
            this.searchFilters.type.toLowerCase()) &&
        (!this.searchFilters.numero ||
          contrat.numero
            ?.toLowerCase()
            .includes(this.searchFilters.numero.toLowerCase())) &&
        (!this.searchFilters.statut ||
          Number(contrat.statut) === Number(this.searchFilters.statut))
      );
    });
    this.updatePagination();
  }

  clearFilters() {
    this.searchFilters = { employeNom: '', type: '', numero: '', statut: '' };
    this.contratsFiltered = [...this.contrats];
    this.updatePagination();
  }

  //  STATUT DU CONTRAT 

  isContractExpired(contrat: any): boolean {
    if (contrat.type?.nom === 'CDI' || !contrat.fin) return false;
    return new Date(contrat.fin) < new Date();
  }

  /** Retourne les jours restants avant expiration (null si CDI ou pas de fin) */
  getJoursRestants(contrat: any): number | null {
    if (contrat.type?.nom === 'CDI' || !contrat.fin) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fin = new Date(contrat.fin);
    fin.setHours(0, 0, 0, 0);
    return Math.floor(
      (fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  /** Retourne le niveau d'alerte : 'expired' | 'critical' | 'warning' | 'info' | null */
  getAlerteNiveau(
    contrat: any,
  ): 'expired' | 'critical' | 'warning' | 'info' | null {
    const jours = this.getJoursRestants(contrat);
    if (jours === null) return null;
    if (jours < 0) return 'expired';
    if (jours === 0) return 'critical';
    if (jours <= 5) return 'critical';
    if (jours <= 7) return 'warning';
    return null;
  }

  /** Texte du badge d'alerte */
  getAlerteBadge(contrat: any): string {
    const jours = this.getJoursRestants(contrat);
    if (jours === null) return '';
    if (jours < 0) return `Expiré depuis ${Math.abs(jours)} j`;
    if (jours === 0) return "Expire aujourd'hui";
    if (jours <= 7) return `Expire dans ${jours} j`;
    return '';
  }

  /** Vrai si le bouton toggle doit être visible */
  canToggleRappel(contrat: any): boolean {
    if (contrat.type?.nom === 'CDI' || !contrat.fin) return false;
    const jours = this.getJoursRestants(contrat);
    return jours !== null && jours <= 7; // zone critique : 7 jours ou expiré
  }

  //  TOGGLE RAPPEL 

  toggleRappel(contrat: any) {
    this.togglingSlug = contrat.slug;
    this.contratSvr.toggleRappel(contrat.slug).subscribe({
      next: (res) => {
        contrat.rappel_actif = res.rappel_actif;
        this.togglingSlug = null;
        this.snackBar.open(res.message, 'Fermer', {
          duration: 3000,
          panelClass: res.rappel_actif ? ['toast-success'] : ['toast-warning'],
        });
      },
      error: (err) => {
        this.togglingSlug = null;
        this.snackBar.open(
          err.error?.message || 'Erreur lors du toggle du rappel',
          'Fermer',
          { duration: 3000, panelClass: ['toast-error'] },
        );
      },
    });
  }

  //  CLASSES CSS 

  getTypeClass(type: string): string {
    switch (type) {
      case 'CDI':
        return 'badge rounded-pill bg-success';
      case 'CDD':
        return 'badge rounded-pill bg-primary';
      case 'FREELANCE':
        return 'badge rounded-pill bg-dark';
      case 'INTERIM':
        return 'badge rounded-pill bg-warning text-dark';
      case 'STAGE':
        return 'badge rounded-pill bg-info text-dark';
      default:
        return 'badge rounded-pill bg-secondary';
    }
  }

  getStatusClass(statut: number): string {
    switch (statut) {
      case 1:
        return 'badge rounded-pill bg-primary';
      case 2:
        return 'badge rounded-pill bg-warning text-dark';
      case 3:
        return 'badge rounded-pill bg-danger';
      case 4:
        return 'badge rounded-pill bg-success';
      default:
        return 'badge rounded-pill bg-secondary';
    }
  }

  getStatuLabel(statut: number): string {
    switch (statut) {
      case 1:
        return 'Actif';
      case 2:
        return 'Inactif';
      case 3:
        return 'Suspendu';
      case 4:
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  }

  //  UTILITAIRES 

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  trackByContrat(index: number, contrat: any): number {
    return contrat.id || index;
  }

  //  PAGINATION 

  get paginatedContrat(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.contratsFiltered.slice(start, start + this.itemsPerPage);
  }

  updatePagination() {
    this.totalPages = Math.ceil(
      this.contratsFiltered.length / this.itemsPerPage,
    );
    if (this.currentPage > this.totalPages)
      this.currentPage = this.totalPages || 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }
  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  //  DIALOGS 

  openAddDialog() {
    this.dialog
      .open(FormContratDialogComponent, { width: 'auto', autoFocus: false })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refresh();
      });
  }

  openEditDialog(contrat?: any) {
    this.dialog
      .open(FormContratDialogComponent, {
        width: 'auto',
        data: contrat || null,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.refresh();
      });
  }

  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;
    this.contratSvr.deleteContrat(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Contrat supprimé avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success'],
        });
      },
      error: () => {
        this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Échec lors de la suppression ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error'],
        });
      },
    });
  }

  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
}
