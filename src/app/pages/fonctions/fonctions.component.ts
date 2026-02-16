import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { FonctionsService } from '../../services/fonctions.service';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from "../loading/loading.component";
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-fonctions',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './fonctions.component.html',
  styleUrl: './fonctions.component.scss'
})
export class FonctionsComponent {
  showConfirmModal = false;
  itemToDelete: any = null;
  fonctions: any[] = [];
  isLoading = true;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private fonctionSvr: FonctionsService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(){
    this.fonctionSvr.getList().subscribe({
      next: (data) => {
        this.fonctions = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des fonctions', err);
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    })
  }
  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'une fonction',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      this.isLoading = true;
      if (formData) {
        this.fonctionSvr.addFonction(formData).subscribe(() => this.refresh());
      }
    });
  }
  openEditDialog(fonction: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'une fonction',
        item: fonction,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.fonctionSvr.updateFonction(fonction.slug, formData).subscribe(() => this.refresh());
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

    this.fonctionSvr.deleteFonction(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Fonction supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression de la fonction ❌', 'Fermer', {
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
