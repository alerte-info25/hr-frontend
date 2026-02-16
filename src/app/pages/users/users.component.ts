import { Component, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from "@angular/material/select";
import { DroitsService } from '../../services/droits.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-users',
  imports: [CommonModule, LoadingComponent, FormsModule, MatSelectModule, ConfirmDeleteDialogComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit{
  roles:any[]=[];
  users:any[]=[];
  isLoading = true;
  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private userSvr: UsersService,
    private snackBar: MatSnackBar,
    private rolesvr: DroitsService
  ){}
  ngOnInit(): void {
    this.refresh();
  }
  refresh(){
    this.isLoading = true;
    this.userSvr.getListeCompte().subscribe({
      next: (data) => {
        this.users = data
        this.isLoading = false;
        // this.snackBar.open('Liste des comptes utilisateurs recupréré avec succès ✅', 'Fermer', {
        //   duration: 3000,
        //   panelClass: ['snackbar-success']
        // });
      },
      error: (err) => {
        this.isLoading = false;

        // ❌ Toast d’erreur
        this.snackBar.open('Erreur lors de la récupération des comptes utilisateurs  ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    })
    this.rolesvr.getListeRole().subscribe({
      next: (data) => {
        this.roles = data
        this.isLoading = false;
        this.snackBar.open('Liste des comptes utilisateurs recupréré avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.isLoading = false;

        // ❌ Toast d’erreur
        this.snackBar.open('Erreur lors de la récupération des comptes utilisateurs  ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    })
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
  getRoleBadge(status:number):string{
    switch(status){
      case 1: return "badge rounded-pill bg-success";
      case 2: return "badge rounded-pill bg-warning text-dark";
      default: return "badge rounded-pill bg-secondary";
    }
  }
  getRoleLabel(status:number){
    switch(status){
      case 1: return 'Actif'
      case 2: return 'Inacrif'
      default: return 'Inconnu'
    }
  }

  onEtatChange(slug:string,value:number): void {
    this.isLoading = true;
    this.userSvr.changeEtatCompte(slug,{ is_actif: value }).subscribe({
      next:()=>{
        this.isLoading = false;
        this.snackBar.open('Comptes utilisateurs mis à jour ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.isLoading = false;

        // ❌ Toast d’erreur
        this.snackBar.open('Erreur lors de la mise à jour du compte utilisateur ❌', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    })

  }
  onRoleChange(slug: string, id_role: number): void {
    this.isLoading = true;
    this.userSvr.changeUserRole(slug, { id_role }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Rôle mis à jour ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la mise à jour du rôle ❌', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    });
  }

  dateString(dateInput: string | Date): string {
  if (dateInput === null) {
    return 'Jamais connecté'
  }

  const date = new Date(dateInput);

  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const jour = date.getDate().toString().padStart(2, '0');
  const moisTexte = mois[date.getMonth()];
  const annee = date.getFullYear();

  return `${jour} ${moisTexte} ${annee}`;
}

  // SUPPRESSION

  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.userSvr.deleteCompte(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.snackBar.open('Compte supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.refresh();
        // this.isLoading = false;
      },
      error: (err) => {
        // this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression du compte ❌', 'Fermer', {
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
