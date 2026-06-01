import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService } from '../../services/categories.service';
import { FormsDialogComponent } from '../../../../pages/dialog/forms-dialog/forms-dialog.component';
import { ConfirmDeleteDialogComponent } from '../../../../pages/dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { InfrasLoadingComponent } from '../infras-loading/infras-loading.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-categorie',
  imports: [CommonModule, InfrasLoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './categorie.component.html',
  styleUrl: './categorie.component.scss'
})
export class CategorieComponent implements OnInit {
  // Services
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private categorieSvr = inject(CategoriesService);
  private snackBar = inject(MatSnackBar);

  // État réactif avec signals
  categories = signal<any[]>([]);
  isLoading = signal(true);
  showConfirmModal = signal(false);
  itemToDelete = signal<any>(null);
  searchTerm = signal('');

  // Categories filtrées par recherche
  filteredCategories = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.categories();
    return this.categories().filter(cat =>
      cat.nom?.toLowerCase().includes(term) ||
      // cat.type?.toLowerCase().includes(term) ||
      cat.description?.toLowerCase().includes(term)
    );
  });

  // Statistiques
  stats = computed(() => ({
    total: this.categories().length,
  //   informatique: this.categories().filter(c => c.type === 'informatique').length,
  //   mobilier: this.categories().filter(c => c.type === 'mobilier').length,
  //   securite: this.categories().filter(c => c.type === 'securite').length,
  //   autre: this.categories().filter(c => c.type === 'autre').length
  }));

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.isLoading.set(true);
    this.categorieSvr.getAll()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.categories.set(data);
          this.showSuccessToast('Catégories chargées avec succès ✅');
        },
        error: (err) => {
          console.error('Erreur de chargement des catégories', err);
          this.showErrorToast(err.message || 'Erreur lors du chargement des catégories');
        }
      });
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: {
        title: 'une catégorie',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] },
          // { name: 'type', label: 'Type', type: 'select2',
          //   options: [
          //     { value: 'informatique', label: 'Informatique' },
          //     { value: 'mobilier', label: 'Mobilier' },
          //     { value: 'securite', label: 'Sécurité' },
          //     { value: 'autre', label: 'Autre' }
          //   ], validators: ['required']
          // }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading.set(true);
        this.categorieSvr.create(formData).subscribe({
          next: () => {
            this.refresh();
            this.showSuccessToast('Catégorie créée avec succès ✨');
          },
          error: (err) => {
            this.isLoading.set(false);
            this.showErrorToast('Erreur lors de la création');
          }
        });
      }
    });
  }

  openEditDialog(categorie: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: {
        title: 'une catégorie',
        item: categorie,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'description', label: 'Description', type: 'textarea', validators: ['required'] },
          // { name: 'type', label: 'Type', type: 'select2',
          //   options: [
          //     { value: 'informatique', label: 'Informatique' },
          //     { value: 'mobilier', label: 'Mobilier' },
          //     { value: 'securite', label: 'Sécurité' },
          //     { value: 'autre', label: 'Autre' }
          //   ], validators: ['required']
          // }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading.set(true);
        this.categorieSvr.update(categorie.slug, formData).subscribe({
          next: () => {
            this.refresh();
            this.showSuccessToast('Catégorie modifiée avec succès ✏️');
          },
          error: (err) => {
            this.isLoading.set(false);
            this.showErrorToast('Erreur lors de la modification');
          }
        });
      }
    });
  }

  openDeleteModal(item: any): void {
    this.itemToDelete.set(item);
    this.showConfirmModal.set(true);
  }

  confirmDelete(): void {
    if (!this.itemToDelete()) return;
    this.isLoading.set(true);

    this.categorieSvr.delete(this.itemToDelete().slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.showSuccessToast('Catégorie supprimée avec succès 🗑️');
      },
      error: (err) => {
        this.closeModal();
        this.isLoading.set(false);
        this.showErrorToast('Échec lors de la suppression de la catégorie');
      }
    });
  }

  closeModal(): void {
    this.showConfirmModal.set(false);
    this.itemToDelete.set(null);
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  // getTypeIcon(type: string): string {
  //   const icons: { [key: string]: string } = {
  //     'informatique': 'computer',
  //     'mobilier': 'chair',
  //     'securite': 'security',
  //     'autre': 'category'
  //   };
  //   return icons[type] || 'category';
  // }

  // getTypeColor(type: string): string {
  //   const colors: { [key: string]: string } = {
  //     'informatique': '#3b82f6',
  //     'mobilier': '#10b981',
  //     'securite': '#ef4444',
  //     'autre': '#8b5cf6'
  //   };
  //   return colors[type] || '#6b7280';
  // }

  private showSuccessToast(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showErrorToast(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
