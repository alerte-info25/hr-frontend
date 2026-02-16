import { Component } from '@angular/core';
import { ObjetService } from '../../services/objet.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { CommonModule } from '@angular/common';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-objets',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './objets.component.html',
  styleUrl: './objets.component.scss'
})
export class ObjetsComponent {
  showConfirmModal = false;
  itemToDelete: any = null;
  fonctions: any[] = [];
  isLoading = true;
  constructor(
    private dialog: MatDialog,
    private objetSvr: ObjetService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(){
    this.objetSvr.getList().subscribe({
      next: (data) => {
        this.fonctions = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des objets de demandes', err);
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
          title: 'une objet de demande',
          fields: [
            { name: 'libelle', label: 'Nom', type: 'text', validators: ['required'] },
          ]
        }
      });

      dialogRef.afterClosed().subscribe(formData => {
        this.isLoading = true;
        if (formData) {
          this.objetSvr.addObjet(formData).subscribe(() => this.refresh());
        }
      });
    }
    openEditDialog(fonction: any): void {
      const dialogRef = this.dialog.open(FormsDialogComponent, {
        width: 'auto',
        data: {
          title: 'un objet de demande',
          item: fonction,
          fields: [
            { name: 'libelle', label: 'Nom', type: 'text', validators: ['required'] },
          ]
        }
      });

      dialogRef.afterClosed().subscribe(formData => {
        if (formData) {
          this.isLoading = true;
          this.objetSvr.updateObjet(fonction.slug, formData).subscribe(() => this.refresh());
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

      this.objetSvr.deleteObjet(this.itemToDelete.slug).subscribe({
        next: () => {
          this.closeModal();
          this.refresh();
          this.snackBar.open('Objet supprimer avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });

          // this.isLoading = false;
        },
        error: (err) => {
          this.closeModal();
          this.isLoading = false;
          this.snackBar.open('Echec lors de la suppression de l\'objet ❌', 'Fermer', {
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
