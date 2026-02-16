import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ContratService } from '../../services/contrat.service';
import { TypeContratService } from '../../services/type-contrat.service';
import { EmployesService } from '../../services/employes.service';
import { LoadingComponent } from '../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormContratDialogComponent } from '../dialog/form-contrat-dialog/form-contrat-dialog.component';

@Component({
  selector: 'app-contrats',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './contrats.component.html',
  styleUrl: './contrats.component.scss'
})
export class ContratsComponent implements OnInit{
  showConfirmModal = false;
  itemToDelete: any = null;
  contrats: any[]=[];
  Typecontrats: any[]=[];
  isLoading = true;
  contratsFiltered: any[] = [];

  searchFilters = {
    employeNom: '',
    type: '',
    numero: '',
    statut: ''
  };
  // pagination
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  // Statistiques
  totalContrats = 0;
  nombreCDI = 0;
  nombreCDD = 0;
  nombreStagiaire = 0;
  nombreInterim = 0;
  nombreFreelance = 0;
  constructor(
    private dialog: MatDialog,
    private contratSvr: ContratService,
    private typecontratSvr: TypeContratService,
    private employeSvr: EmployesService,
    private snackBar: MatSnackBar
  ){}
  ngOnInit() {
    this.refresh();
  }
  refresh(){
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
      }
    })
    this.typecontratSvr.getList().subscribe({
      next: (data) => {
        this.Typecontrats = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des types de contrats', err);
        this.isLoading = false;
      }
    })
  }

  calculateStats() {
    this.totalContrats = this.contrats.length;
    this.nombreCDI = this.contrats.filter(c => c.type.nom == 'CDI').length;
    this.nombreCDD = this.contrats.filter(c => c.type.nom === 'CDD').length;
    this.nombreStagiaire = this.contrats.filter(c => c.type.nom === 'STAGE').length;
    this.nombreInterim = this.contrats.filter(c => c.type.nom === 'INTERIM').length;
    this.nombreFreelance = this.contrats.filter(c => c.type.nom === 'FREELANCE').length;
  }

  applyFilters() {
    this.contratsFiltered = this.contrats.filter(contrat => {
      return (
        (!this.searchFilters.employeNom ||
        (
          (contrat.employe?.nom?.toLowerCase().includes(this.searchFilters.employeNom.toLowerCase())) ||
          (contrat.employe?.prenom?.toLowerCase().includes(this.searchFilters.employeNom.toLowerCase()))
        )
        )
         &&
        (!this.searchFilters.type ||
        contrat.type?.nom?.toLowerCase() === this.searchFilters.type.toLowerCase()
        )
         &&
        (!this.searchFilters.statut || Number(contrat.statut) === Number(this.searchFilters.statut))

      );
    });
    this.updatePagination();
  }

  clearFilters() {
    this.searchFilters = {
      employeNom: '',
      type: '',
      numero: '',
      statut: ''
    };
    this.contratsFiltered = [...this.contrats];
    this.updatePagination();
  }


  getTypeClass(type: string): string {
    switch (type) {
      case 'CDI': return "badge rounded-pill bg-success";
      case 'CDD': return "badge rounded-pill bg-primary";
      case 'FREELANCE': return "badge rounded-pill bg-dark";
      case 'INTERIM': return "badge rounded-pill bg-warning text-dark";
      case 'STAGE': return "badge rounded-pill bg-info text-dark";

      default:
        return "badge rounded-pill bg-secondary"

    }
  }

  getStatusClass(statut: number): string {
    switch(statut){
      case 1: return "badge rounded-pill bg-primary";break;
      case 2: return "badge rounded-pill bg-warning text-dark";break;
      case 3: return "badge rounded-pill bg-danger";break;
      case 4: return "badge rounded-pill bg-success";break;
      default:
        return "badge rounded-pill bg-secondary";
      break;
    }
  }
  getStatuLabel(statut: number){
    switch (statut) {
      case 1: return 'Actif';break;
      case 2: return 'Inactif';break;
      case 3: return 'Suspendu';break;
      case 4: return 'Terminer';break;
      default:
        return 'Inconnu';
        break;
    }
  }

  // isContractExpired(contrat: any): boolean {
  //   const today = new Date();
  //   return new Date(contrat.fin) < today;
  // }
  isContractExpired(contrat: any): boolean {
    if (contrat.type?.nom === 'CDI') {
      return false;
    }

    if (!contrat.fin || contrat.fin === null) {
      return false;
    }

    const today = new Date();
    return new Date(contrat.fin) < today;
  }


  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  trackByContrat(index: number, contrat: any): number {
    return contrat.id || index;
  }
  // pagination
  get paginatedContrat(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.contratsFiltered.slice(start, end);
  }
   updatePagination() {
    this.totalPages = Math.ceil(this.contratsFiltered.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages || 1;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }
  openAddDialog() {
    const dialogRef = this.dialog.open(FormContratDialogComponent, {
      width: 'auto',
      autoFocus: false
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refresh(); // recharger la liste
      }
    });
  }
  openEditDialog(contrat?: any) {
    const dialogRef = this.dialog.open(FormContratDialogComponent, {
      width: 'auto',
      data: contrat || null // si null => ajout, sinon modification
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refresh(); // rafraîchir la liste
      }
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
        this.snackBar.open('Contrat supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression du contrat ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }

  // Ferme le modal sans supprimer
  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

}
