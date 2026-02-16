import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { DroitsService } from '../../services/droits.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-roles',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss'
})
export class RolesComponent {
  isLoading = true;
  roles: any[] = [];
  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private roleSvr: DroitsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.refresh()
   }
  refresh(){
    this.isLoading = true;
    this.roleSvr.getListeRole().subscribe({
      next: (data) => {
        this.roles = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
        console.error('Erreur', err);
      }
    })
  }
  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un rôle',
        fields: [
          { name: 'libelle', label: 'Libelle', type: 'text', validators: ['required'] }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      this.isLoading = true;
      if (formData) {
        this.roleSvr.addRole(formData).subscribe({
          next: () => {
            this.snackBar.open('Rôle ajouter avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.refresh()
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.message, 'Fermer', {
              duration: 4000,
              panelClass: ['toast-error']
            });
            console.error('Erreur lors de la suppression', err);
          }
        });
      }
    });
  }
  openEditDialog(role: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un rôle',
        item: role,
        fields: [
          { name: 'libelle', label: 'Libelle', type: 'text', validators: ['required'] },
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.roleSvr.updateRole(role.slug, formData).subscribe({
          next: () => {
            this.snackBar.open('Rôle modifier avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.refresh()
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.message, 'Fermer', {
              duration: 4000,
              panelClass: ['toast-error']
            });
            console.error('Erreur lors de la suppression', err);
          }
        });
      }
    });
  }

   // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.roleSvr.deleteRole(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Rôle supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression du rôle ❌', 'Fermer', {
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

