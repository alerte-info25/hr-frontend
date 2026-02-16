import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { CommonModule } from '@angular/common';
import { TypeCongesService } from '../../services/type-conges.service';
import { LoadingComponent } from "../loading/loading.component";
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-type-conges',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './type-conges.component.html',
  styleUrl: './type-conges.component.scss'
})
export class TypeCongesComponent {
  isLoading = true;
  typecontrat: any[] = [];
  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private typecongeSvr: TypeCongesService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.refresh();
  }
  refresh(){
    this.typecongeSvr.getList().subscribe({
      next: (data) => {
        this.typecontrat = data;
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
  }
  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un type de congé',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      this.isLoading = true;
      if (formData) {
        this.typecongeSvr.addTypeConge(formData).subscribe({
          next: () => {
            this.refresh();
            this.snackBar.open('Type de congé ajouté avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            // this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open('Echec lors de l\'ajout du type de congé ❌', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-error']
            });
          }
        });
      }
    });
  }
  openEditDialog(typeC: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un type de congé',
        item: typeC,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea' },
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.typecongeSvr.updateTypeConge(typeC.slug, formData).subscribe({
          next: () => {
            this.refresh();
            this.snackBar.open('Type de congé modifié avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            // this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.closeModal();
            this.snackBar.open('Echec lors de la modification du type de congé ❌', 'Fermer', {
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

    this.typecongeSvr.deleteTypeConge(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.snackBar.open('Type de congé supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.refresh();
        // this.isLoading = false;
      },
      error: (err) => {
        // this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression du type de congé ❌', 'Fermer', {
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
