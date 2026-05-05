import { BureauService } from './../../services/bureau.service';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { LoadingComponent } from '../loading/loading.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bureaux',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './bureaux.component.html',
  styleUrl: './bureaux.component.scss'
})
export class BureauxComponent {
  bureaux: any[] = [];
  showConfirmModal = false;
  itemToDelete: any = null;
  isLoading = true;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private bureauSvr: BureauService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void { 
    this.refresh();
  }

  refresh(){
    this.bureauSvr.getList().subscribe({
      next: (data) => {
        this.bureaux = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    });
  }


  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un bureau',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'acronyme', label: 'Acronyme', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      this.isLoading = true;
      if (formData) {
        this.bureauSvr.addBureau(formData).subscribe(() => this.refresh());
      }
    });
  }
  openEditDialog(bureau: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un bureau',
        item: bureau,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'acronyme', label: 'Acronyme', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.bureauSvr.updateBureau(bureau.slug, formData).subscribe(() => this.refresh());
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

    this.bureauSvr.deleteBureau(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Bureau supprimé avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression du bureau ❌', 'Fermer', {
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
