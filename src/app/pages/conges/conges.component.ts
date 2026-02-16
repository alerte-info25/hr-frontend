import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PermissionService } from '../../services/permission.service';
import { CongesService } from '../../services/conges.service';
import { LoadingComponent } from '../loading/loading.component';
import { MatDialog } from '@angular/material/dialog';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { TypeCongesService } from '../../services/type-conges.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { DetailsCongesComponent } from '../details-conges/details-conges.component';
import { ActionCongesComponent } from "../action-conges/action-conges.component";
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-conges',
  imports: [LoadingComponent, CommonModule, FormsModule, DetailsCongesComponent, ActionCongesComponent, ConfirmDeleteDialogComponent],
  templateUrl: './conges.component.html',
  styleUrl: './conges.component.scss',
  animations: [
    trigger('slideToggle', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden'
      })),
      transition('collapsed <=> expanded', [
        animate('300ms ease-in-out')
      ])
    ])
  ],
})
export class CongesComponent {
  showConfirmModal = false;
  itemToDelete: any = null;
  selectedConge?: any;
  CongeSelect?: any;
  isLoading = true;
  totalmesDemande: number=0;
  mesDemandesEnAttente: number=0;
  mesDemandesAccepte: number=0;
  mesDemandesRefuse: number=0;
  totalJoursPris: any;
  closeDetails() {
    this.selectedConge = undefined; // supprime la sélection
  }
  closeDetails1() {
    this.CongeSelect = undefined; // supprime la sélection
  }
  currentEmployeeId = 1;
  isDemandeCollapsed = false;
  isDemandeListeCollapsed = false;
  conges: any[] = [];
  demandeEnAttente:any[]=[];
  typeConge:any[]=[];
  MesDemandes:any[] = []
  filterConge:any[] = [];
  filterMesDemandes:any[] = []
  searchText: string = '';
  selectedType: string = '';
  selectedStatus: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortField: keyof any = 'employeeName';
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalPages: number = 1;
  currentDemandePage: number = 1;
  itemsDemandePerPage: number = 6;
  totalDemandePages: number = 1;
  activeView: 'admin' | 'employe' = 'employe';

  setView(view: 'admin' | 'employe') {
    this.activeView = view;
  }
  id_employe:string = '';
  role_employe: string='';
  totalPermission:number = 0
  permissionEnAttente:number = 0
  permissionAccepte:number = 0
  permissionRefuse:number = 0
  constructor(
    private dialog: MatDialog,
    private congeSvr: CongesService,
    private typeSvr: TypeCongesService,
    private snackBar: MatSnackBar,
    private authSvr: AuthService
  ){}
  ngOnInit(): void {
    const userData = localStorage.getItem('user_token');
    if (userData) {
      const user = JSON.parse(userData);
      this.id_employe = user?.employe?.slug || '';
      this.role_employe = user?.role?.libelle || '';
    }
    this.refresh();
  }
  isAdmin(): boolean {
    return this.role_employe.toLocaleLowerCase() === 'directeur' || this.role_employe.toLocaleLowerCase() === 'rh';
  }
  refresh(){
    this.congeSvr.getList().subscribe({
      next: (data) => {
        this.conges = data;
        this.filterConge = [...this.conges]
        const today = new Date();
        today.setHours(0, 0, 0, 0); // normalisation

        this.demandeEnAttente = this.conges.filter(p => {
          const debut = new Date(p.debut);
          debut.setHours(0, 0, 0, 0); // normalisation

          // return p.statut === 1 && debut >= today;
          return p.statut === 1 && debut.getTime() >= today.getTime();
        });

        this.totalPermission = this.conges.length;
        this.permissionEnAttente = this.conges.filter(p => p.statut == 1).length;
        this.permissionAccepte = this.conges.filter(p => p.statut == 2).length;
        this.permissionRefuse = this.conges.filter(p => p.statut == 3).length;


        this.updatePagination();
        this.updateDemandePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
        this.isLoading = false;
      }
    })
    this.congeSvr.getCongeByEmp(this.id_employe).subscribe({
      next: (data) => {
        this.MesDemandes = data;
        this.filterMesDemandes = [...this.MesDemandes]
      }
    })

    this.typeSvr.getList().subscribe({
      next: (data) => {
        this.typeConge = data;
        this.isLoading = false;

        // mes demandes
        this.totalmesDemande = this.MesDemandes.length;
        this.mesDemandesEnAttente = this.MesDemandes.filter(p => p.statut == 1).length;
        this.mesDemandesAccepte = this.MesDemandes.filter(p => p.statut == 2).length;
        this.mesDemandesRefuse = this.MesDemandes.filter(p => p.statut == 3).length;
        this.totalJoursPris = this.MesDemandes
          .filter(p => p.statut == 2) // seulement acceptées
          .reduce((total, p) => {
            const debut = new Date(p.debut);
            const fin = new Date(p.fin);

            // différence en jours (inclusif)
            const diffTime = fin.getTime() - debut.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

            return total + (diffDays > 0 ? diffDays : 0);
        }, 0);
        this.updatePagination();
        this.updateDemandePagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }

    })

  }




  changerStatut(demande: any, status: 2 | 3) {
    demande.status = status;
  }
  toggleDemandeAttente() {
    this.isDemandeCollapsed = !this.isDemandeCollapsed;
  }
  toggleDemandeListe() {
    this.isDemandeListeCollapsed = !this.isDemandeListeCollapsed;
  }
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
  getStatutBadge(status:number):string{
    switch(status){
      case 1: return "badge rounded-pill bg-warning text-dark";
      case 2: return "badge rounded-pill bg-success";
      case 3: return "badge rounded-pill bg-danger";
      default: return "badge rounded-pill bg-secondary";
    }
  }
  getStatutLabel(status:number){
    switch(status){
      case 1: return 'En attente'
      case 2: return 'Acceptée'
      case 3: return 'Refusée'
      default: return 'Inconnu'
    }
  }
  getDuration(permission: any): number {
    const start = new Date(permission.startDate);
    const end = new Date(permission.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  isLocked(dateDebut: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const debut = new Date(dateDebut);
  debut.setHours(0, 0, 0, 0);

    return debut < today;
  }
  isLocke(dateDebut: Date, statut: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);

    return debut < today && statut === 1;
  }

  demandeBloque(dateDebut: Date, statut: number): boolean{
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);

    return debut < today || statut !== 1;
  }
   // Filtrer les demandes
  filterEmployees() {
    this.filterConge = this.conges.filter(pers => {
      const matchSearch = this.searchText
      ? (pers.employe?.nom + ' ' + pers.employe?.prenom)
          .toLowerCase()
          .includes(this.searchText.toLowerCase())
      : true;
      const matchType = this.selectedType ? pers.type.id === Number(this.selectedType) : true;
      const matchStatut = this.selectedStatus ? pers.statut === Number(this.selectedStatus) : true;
      return matchSearch && matchType && matchStatut;
    });
    this.sortEmployees();
    this.updatePagination();
  }
  toggleSortDirection() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortEmployees();
  }
   // Trier les demandes
  sortEmployees() {
    this.filterConge.sort((a, b) => {
    const aName = a.employe?.nom?.toLowerCase() || '';
    const bName = b.employe?.nom?.toLowerCase() || '';
      if (aName < bName) return this.sortDirection === 'asc' ? -1 : 1;
      if (aName > bName) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.updatePagination();
  }

    // Pagination
  get paginatedPermissions(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;

    return this.filterConge.slice(start, end);

  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filterConge.length / this.itemsPerPage);
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

  // Mes demandes

  get paginatedDemandePermissions(): any[] {
    const start = (this.currentDemandePage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filterMesDemandes.slice(start, end);
  }
  updateDemandePagination() {
    this.totalDemandePages = Math.ceil(this.filterMesDemandes.length / this.itemsDemandePerPage);
    if (this.currentDemandePage > this.totalDemandePages) this.currentDemandePage = this.totalDemandePages || 1;
  }
  goToDemandePage(page: number) {
    if (page < 1 || page > this.totalDemandePages) return;
    this.currentDemandePage = page;
  }

  nextDemandePage() {
    if (this.currentDemandePage < this.totalDemandePages) this.currentDemandePage++;
  }

  prevDemandePage() {
    if (this.currentDemandePage > 1) this.currentDemandePage--;
  }

  openAddDialog(): void {
    this.typeSvr.getList().subscribe({
      next: (types) =>{
        const dialogRef = this.dialog.open(FormsDialogComponent, {
        width: 'auto',
        data: {
          title: 'une demande de congé',
          fields: [
            { name: 'id_type',
              label: 'Type',
              type: 'select2',
              options: types.map(t => ({
                value: t.slug, label: t.nom
              }))
            },
            { name: 'dateDemande', label: 'Date de la demande', type: 'date', validators: ['required'] },
            { name: 'debut', label: 'Date de départ', type: 'date', validators: ['required'] },
            { name: 'fin', label: 'Date de retour', type: 'date', validators: ['required'] },
            { name: 'raison', label: 'Raison', type: 'textarea' },
            { name: 'document', label: 'Document', type: 'file2'}
          ]
        }
      });

      dialogRef.afterClosed().subscribe(formData => {
        if (formData) {
          this.isLoading = true;
          formData.append('id_employe',this.id_employe);
          this.congeSvr.addConge(formData).subscribe({
            next: (res) => {
              this.isLoading = false;
              this.refresh();

              // ✅ Toast de succès
              this.snackBar.open('Demande de congé enregistrée avec succès ✅', 'Fermer', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['snackbar-success']
              });
            },
            error: (err) => {
              this.isLoading = false;

              // ❌ Toast d’erreur
              this.snackBar.open('Échec de l’enregistrement de la demande ❌', 'Fermer', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['snackbar-error']
              });
              console.error(err);
            }
          });
        }
      });
      }
    })
  }
  openEditDialog(permission: any): void {
  this.typeSvr.getList().subscribe({
    next: (types) => {
      const dialogRef = this.dialog.open(FormsDialogComponent, {
        width: 'auto',
        data: {
          title: 'une demande de congé',
          item: permission,
          fields: [
            {
              name: 'id_type',
              label: 'Type',
              type: 'select2',
              options: types.map(t => ({
                value: t.slug, label: t.nom
              })),
            },
            { name: 'date_demande', label: 'Date de la demande', type: 'date' },
            { name: 'debut', label: 'Date de départ', type: 'date' },
            { name: 'fin', label: 'Date de retour', type: 'date' },
            { name: 'raison', label: 'Raison', type: 'textarea' },
            { name: 'document', label: 'Document', type: 'file2' } // tu ne pré-remplis pas un fichier
          ]
        }
      });

      dialogRef.afterClosed().subscribe((formData: FormData) => {
        if (formData) {
          this.isLoading = true;

          // si tu veux rester en FormData (pour fichier)
          formData.append('id_employe', this.id_employe);

          this.congeSvr.updateConge(permission.slug, formData).subscribe({
            next: (res) => {
              this.isLoading = false;
              this.refresh();

              // ✅ Toast de succès
              this.snackBar.open('Demande de congé enregistrée avec succès ✅', 'Fermer', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['snackbar-success']
              });
            },
            error: (err) => {
              this.isLoading = false;

              // ❌ Toast d’erreur
              this.snackBar.open('Échec de l’enregistrement de la demande ❌', 'Fermer', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['snackbar-error']
              });
              console.error(err);
            }
          });
        }
      });
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

    this.congeSvr.deleteConge(this.itemToDelete.slug).subscribe({
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
        this.isLoading = false;
        this.closeModal();
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

}
