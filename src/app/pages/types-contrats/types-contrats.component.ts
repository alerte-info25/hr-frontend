import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { TypeContratService } from '../../services/type-contrat.service';
import { LoadingComponent } from '../loading/loading.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-types-contrats',
  imports: [LoadingComponent, ConfirmDeleteDialogComponent,CommonModule],
  templateUrl: './types-contrats.component.html',
  styleUrl: './types-contrats.component.scss'
})
export class TypesContratsComponent {
  typecontrat: any[]=[];
  isLoading = true;
  showConfirmModal = false;
  itemToDelete: any = null;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private typecontratSvr: TypeContratService,
    private snackBar: MatSnackBar
  ) { }
  ngOnInit(){
    this.refresh();
  }
  refresh(){
    this.typecontratSvr.getList().subscribe({
      next: (data) => {
        this.typecontrat = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des types de contrats', err);
        this.isLoading = false;
      }
    })
  }
  // SUPPRESSION

  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.typecontratSvr.deleteTypeContrat(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.snackBar.open('Type contrat supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.refresh();
        // this.isLoading = false;
      },
      error: (err) => {
        // this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression de type de contrat ❌', 'Fermer', {
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
  openAddDialog(): void {
        const dialogRef = this.dialog.open(FormsDialogComponent, {
          width: 'auto',
          data: {
            title: 'un type de contrat',
            fields: [
              { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
              { name: 'description', label: 'Description', type: 'textarea' },
              { name: 'duree', label: 'Durée', type: 'number' }
            ]
          }
        });

        dialogRef.afterClosed().subscribe(formData => {
          this.isLoading = true;
          if (formData) {
            this.typecontratSvr.addTypeContrat(formData).subscribe(() => this.refresh());
          }
        });
  }
  openEditDialog(typeC: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un type de contrat',
        item: typeC,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'duree', label: 'Durée', type: 'number' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.typecontratSvr.updateTypeContrat(typeC.slug, formData).subscribe(() => this.refresh());
      }
    });
  }
}
