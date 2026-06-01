import { Component, OnInit } from '@angular/core';
import { FournisseurService } from '../../services/fournisseur.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormsDialogComponent } from '../../../../pages/dialog/forms-dialog/forms-dialog.component';
import { InfrasLoadingComponent } from '../infras-loading/infras-loading.component';
import { ConfirmDeleteDialogComponent } from '../../../../pages/dialog/confirm-delete-dialog/confirm-delete-dialog.component';

export interface Fournisseur {
  id: number | string;
  slug: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  note?: string;
  notes?: string;
}

@Component({
  selector: 'app-infras-fournisseur',
  imports: [MaterialModule, CommonModule, FormsModule, InfrasLoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './infras-fournisseur.component.html',
  styleUrl: './infras-fournisseur.component.scss'
})
export class InfrasFournisseurComponent implements OnInit {
  fournisseurs: Fournisseur[] = [];
  isLoading = true;
  search = '';
  showConfirmModal = false;
  itemToDelete: Fournisseur | null = null;

  private readonly DIALOG_FIELDS = [
    { name: 'nom',       label: 'Nom complet', type: 'text',    validators: ['required'] },
    { name: 'telephone', label: 'Téléphone',   type: 'tel',      validators: ['required'] },
    { name: 'email',     label: 'Email',        type: 'email',    validators: ['required'] },
    { name: 'adresse',   label: 'Adresse',      type: 'textarea', validators: [] },
    { name: 'notes',      label: 'Notes',        type: 'textarea', validators: []           },
  ];

  constructor(
    private fournisseurService: FournisseurService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.isLoading = true;

    this.fournisseurService.getAll().subscribe({
      next: (res: Fournisseur[]) => {
        this.fournisseurs = res;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur de chargement des fournisseurs', 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    });
  }

  get filteredFournisseurs(): Fournisseur[] {
    const term = this.search.toLowerCase().trim();
    if (!term) return this.fournisseurs;
    return this.fournisseurs.filter(f =>
      f.nom?.toLowerCase().includes(term) ||
      f.email?.toLowerCase().includes(term) ||
      f.telephone?.toLowerCase().includes(term)
    );
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un fournisseur',
        fields: this.DIALOG_FIELDS
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (!formData) return;
      this.isLoading = true;
      this.fournisseurService.addFournisseur(formData).subscribe({
        next: () => {
          this.refresh();
          this.snackBar.open('Fournisseur ajouté avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Erreur lors de l\'ajout du fournisseur ❌', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-error']
          });
        }
      });
    });
  }

  openEditDialog(fournisseur: Fournisseur): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un fournisseur',
        item: fournisseur,
        fields: this.DIALOG_FIELDS
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (!formData) return;
      this.isLoading = true;
      this.fournisseurService.updateFournisseur(fournisseur.slug, formData).subscribe({
        next: () => {
          this.refresh();
          this.snackBar.open('Fournisseur modifié avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la modification ❌', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-error']
          });
        }
      });
    });
  }

  openDeleteModal(item: Fournisseur): void {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  confirmDelete(): void {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.fournisseurService.deleteFournisseur(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Fournisseur supprimé avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
      },
      error: () => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Échec lors de la suppression ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }

  closeModal(): void {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
}
