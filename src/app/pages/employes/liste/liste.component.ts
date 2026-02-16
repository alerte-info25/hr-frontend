import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MaterialModule } from "../../../../../material.module";
import { Employe } from '../../../../data/employe';
import { EmployesService } from '../../../services/employes.service';
import { ServicesService } from '../../../services/services.service';
import { FonctionsService } from '../../../services/fonctions.service';
import { LoadingComponent } from '../../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from '../../../services/users.service';


@Component({
  selector: 'app-liste',
  imports: [
    CommonModule, FormsModule,
    ReactiveFormsModule, RouterLink,
    MaterialModule, LoadingComponent,
    ConfirmDeleteDialogComponent
  ],
  templateUrl: './liste.component.html',
  styleUrls: ['./liste.component.scss']
})
export class ListeComponent implements OnInit {

  showConfirmModal = false;
  itemToDelete: any = null;
  isLoading = true;
  constructor(
    private employeSvr: EmployesService,
    private svrservice: ServicesService,
    private fonctionSvr: FonctionsService,
    private snackBar: MatSnackBar,
    private userSvr: UsersService
  ){}
  employees: any[] =[];

  services:any[] = [];
  fonctions:any[] = [];

  searchText: string = '';
  selectedFonction: string = '';
  sortField: keyof any = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';

  filteredEmployees: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalPages: number = 1;
  countries: any;

  ngOnInit(): void {
    this.refresh();
  }
  refresh(){
    this.isLoading = true;
    this.employeSvr.getList().subscribe({
      next: (data) => {
        this.employees = data;
        this.isLoading = false;
        this.filteredEmployees = [...this.employees]; // initialiser
        this.sortEmployees();
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des employés', err);
        this.snackBar.open('Erreur de chargement des employés','Fermer',{
          duration: 3000
        })
        this.isLoading = false;
      }
    })
    this.fonctionSvr.getList().subscribe({
      next: (data) => {
        this.fonctions = data
        this.isLoading = false
      },
      error: (err) => {
        console.error('Erreur de chargement des fonctions', err);
        this.snackBar.open('Erreur de chargement des fonctions','Fermer',{
          duration: 3000
        })
        this.isLoading = false;
      }
    })
    this.svrservice.getList().subscribe({
      next: (data) => {
        this.services = data
        this.isLoading = false
      },
      error: (err) => {
        console.error('Erreur de chargement des services', err);
        this.snackBar.open('Erreur de chargement des services','Fermer',{
          duration: 3000
        })

        this.isLoading = false;
      }
    })
  }
  // Filtrer les employés
  filterEmployees() {
    this.filteredEmployees = this.employees.filter(emp => {
      const search = this.searchText.toLowerCase();
      const matchSearch =
        emp.nom?.toLowerCase().includes(search) ||
        emp.prenom?.toLowerCase().includes(search) ||
        emp.matricule?.toLowerCase().includes(search);
      const matchRole = this.selectedFonction ? emp.id_fonction === this.selectedFonction : true;

      return matchSearch && matchRole;
    });
    this.sortEmployees();
    this.updatePagination();
  }
  // Trier les employés
  sortEmployees() {
    this.filteredEmployees.sort((a, b) => {
      const field = this.sortField;
      const aValue = a[field] ?? '';
      const bValue = b[field] ?? '';
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.updatePagination();
  }

  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortEmployees();
  }
  getBadgeEtat(numero: number): string {
    switch (numero) {
      case 1: return 'badge rounded-pill bg-success';
      case 2: return 'badge rounded-pill bg-warning';
      case 3: return 'badge rounded-pill bg-primary';
      case 4: return 'badge rounded-pill bg-danger';
      default: return 'badge rounded-pill bg-secondary';
    }
  }
  getTextEtat(numero: number):string {
    switch(numero){
      case 1: return 'Présent';
      case 2: return 'En congés';
      case 3: return 'Permissionnaire';
      case 4: return 'Indisponible';
      default: return 'Non renseigné'
    }
  }

  // Pagination
  get paginatedEmployees(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredEmployees.slice(start, end);
  }

  updatePagination() {
    // this.refresh();
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
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

  getInitials(nom: string, prenom: string): string {
    const firstLetter = prenom ? prenom.charAt(0) : '';
    const lastLetter = nom ? nom.charAt(0) : '';
    return (firstLetter + lastLetter).toUpperCase();
  }
  // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.employeSvr.deleteEmployes(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Employé supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression de l\'employé ❌', 'Fermer', {
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
  creerCompte(data: any) {
    this.isLoading=true;
    const form={
      'id_employe':data.slug
    }
    this.userSvr.addCompte(form).subscribe({
      next : (res)=>{
        this.isLoading = false;
        this.refresh();
        this.snackBar.open(res.message || 'Compte de l\'employé créer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

      },
      error: (err) => {
        this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la création du compte de l\'employé ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });


  }

}
