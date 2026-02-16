import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrimeService } from '../../services/prime.service';
import { Projet } from '../../../models/projet.model';
import { MaterialModule } from '../../../../../material.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { LoadingComponent } from '../../loading/loading.component';
@Component({
  selector: 'app-projets-liste',
  imports: [CommonModule, FormsModule, MaterialModule, ConfirmDeleteDialogComponent, LoadingComponent],
  templateUrl: './projets-liste.component.html',
  styleUrl: './projets-liste.component.scss'
})
export class ProjetsListeComponent {
  isLoading = false;
  projets: Projet[] = [];
  filteredProjets: Projet[] = [];
  loading = true;
  error: string | null = null;
  showConfirmModal = false;
  itemToDelete: any = null;
  updatingSlug: string | null = null;
  // Filtres
  searchTerm = '';
  selectedStatut = 'tous';
  statuts = [
    { value: 'tous', label: 'Tous les statuts' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminé' },
    { value: 'annule', label: 'Annulé' }
  ];

  constructor(
    private primeService: PrimeService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets(): void {
    this.loading = true;
    this.error = null;

    this.primeService.getProjets().subscribe({
      next: (data) => {
        this.projets = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredProjets = this.projets.filter(projet => {
      const matchSearch = projet.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                         projet.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchStatut = this.selectedStatut === 'tous' || projet.statut === this.selectedStatut;

      return matchSearch && matchStatut;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatutChange(): void {
    this.applyFilters();
  }
  onChangerStatut(projet: any): void {
    const previousStatut = projet.statut; // garder l'ancien au cas où
    this.updatingSlug = projet.slug;

    this.primeService.updateStatut(projet.slug, { statut: projet.statut }).subscribe({
      next: (response) => {
        this.snackBar.open('Statut mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.updatingSlug = null;
      },
      error: (error) => {
        this.snackBar.open('Erreur lors de la mise a jour du statut', 'Fermer', { duration: 4000 });
        console.error('Erreur lors de la mise à jour du statut', error);
        projet.statut = previousStatut; // rétablir l'ancien statut
        this.updatingSlug = null;
      }
    });
  }

  formatMontant(montant: number): string {
    return this.primeService.formatMontant(montant);
  }

  getStatutBadgeClass(statut: string): string {
    return this.primeService.getStatutBadgeClass(statut);
  }

  getStatutLabel(statut: string): string {
    return this.primeService.getStatutLabel(statut);
  }

  navigateToDetail(projet: any): void {
    if (!projet || !projet.id) return;
    this.router.navigate(['/projets', projet.id]);
  }


  navigateToNew(): void {
    this.router.navigate(['/projets/nouveau']);
  }
  retour(): void {
    this.router.navigate(['/suivi-primes']);
  }

  // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.primeService.deleteProjet(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.loadProjets()
        this.snackBar.open('Fonction supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression du projet ❌', 'Fermer', {
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
