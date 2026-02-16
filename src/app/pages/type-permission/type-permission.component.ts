import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { TypePermissionsService } from '../../services/type-permissions.service';
import { LoadingComponent } from '../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-type-permission',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './type-permission.component.html',
  styleUrl: './type-permission.component.scss'
})
export class TypePermissionComponent {
  typePermissions: any[] = [];
  isLoading = true;
  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private typePermisSvr: TypePermissionsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.refresh();
  }
  refresh(){
    this.typePermisSvr.getList().subscribe({
      next: (data) => {
        this.typePermissions = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des types de permissions', err);
        this.isLoading = false;
      }
    })
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un type de permission',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      this.isLoading = true;
      if (formData) {
        this.typePermisSvr.addTypePermission(formData).subscribe({
          next: () => {
            this.refresh();
            this.snackBar.open('Type de permission ajouté avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open('Echec lors de l\'ajout du type de permission ❌', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-error']
            });
          }
        });
      }
    });
  }
  openEditDialog(typeP: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un type de permission',
        item: typeP,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.typePermisSvr.updateTypePermission(typeP.slug, formData).subscribe({
          next: () => {
            this.refresh();
            this.snackBar.open('Type de permission modifié avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open('Echec lors de la modification du type de permission ❌', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-error']
            });
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

    this.typePermisSvr.deleteTypePermission(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.snackBar.open('Employé supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.refresh();
        // this.isLoading = false;
      },
      error: (err) => {
        // this.isLoading = false;
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
