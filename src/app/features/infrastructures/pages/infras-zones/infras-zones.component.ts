import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../../../../pages/dialog/forms-dialog/forms-dialog.component';
import { CategoriesService } from '../../services/categories.service';
import { CommonModule } from '@angular/common';
import { InfrasLoadingComponent } from '../infras-loading/infras-loading.component';
import { ConfirmDeleteDialogComponent } from '../../../../pages/dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { ZonesService } from '../../services/zones.service';
import { BureauxService } from '../../services/bureaux.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-infras-zones',
  imports: [CommonModule, InfrasLoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './infras-zones.component.html',
  styleUrl: './infras-zones.component.scss'
})
export class InfrasZonesComponent {
  showConfirmModal = false;
  itemToDelete: any = null;
  zones: any[] = [];
  bureaux: any[] = [];
  isLoading = true;
  noBureau = false;
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private zoneSvr: ZonesService,
    private bureauSvr: BureauxService,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAllBureau();
    this.loadZonesByRole();
  }

  getAllZone(){
    this.zoneSvr.getAll().subscribe({
      next: (data) => {
        this.zones = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des pièces', err);
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    })
  }

  getHerZone(bureauslug: string) {
    this.zoneSvr.getZonesByBureau(bureauslug).subscribe({
      next: (data) => {
        this.zones = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Une erreur est survenue lors du chargement des pièces du bureau', 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    });
  }

  loadZonesByRole() {
    if (this.authService.isDG()) {

      this.getAllZone();
    } else {
      const bureauSlug = this.authService.getCurrentUser()?.employe?.bureau?.slug;
      if (bureauSlug) {
        this.getHerZone(bureauSlug);
      } else {
        this.zones = [];
        this.isLoading = false;
        this.noBureau = true;
        this.snackBar.open(
          "Impossible de charger vos pièces : votre bureau est inconnu.",
          "Fermer",
          {
            duration: 4000,
            panelClass: ['toast-error']
          }
        );
      }
    }
  }

  loadAllBureau(){
    this.bureauSvr.getAll().subscribe({
      next: (data) => {
        this.bureaux = data;
      },
      error: (err) => {
        console.error('Erreur de chargement des bureaux', err);
        this.snackBar.open('Une erreur est survenue lors du chargement des bureaux', 'Fermer', {
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
        title: 'une pièce',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] },
          { name: 'bureau', label: 'Bureau', type: 'select2',
            options: this.bureaux.map((bureau: any) => ({ value: bureau.rh_slug, label: bureau.acronyme })),
            validators: ['required']
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.zoneSvr.create(formData).subscribe({
          next: () => this.loadZonesByRole(),
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.error.message||'Echec lors de la création de la pièce ❌', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-error']
            });
          }
        });
      }
    });
  }
  openEditDialog(zone: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'une pièce',
        item: zone,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] },
          { name: 'bureau', label: 'Bureau', type: 'select2',
            options: this.bureaux.map((bureau: any) => ({ value: bureau.rh_slug, label: bureau.acronyme })),
            validators: ['required']
          }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.zoneSvr.update(zone.slug, formData).subscribe({
          next: () => this.loadZonesByRole(),
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.error.message||'Echec lors de la mise à jour de la pièce ❌', 'Fermer', {
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

    this.zoneSvr.delete(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.loadZonesByRole();
        this.snackBar.open('Pièce supprimée avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression de la pièce ❌', 'Fermer', {
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
