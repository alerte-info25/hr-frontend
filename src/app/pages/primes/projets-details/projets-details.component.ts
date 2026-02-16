import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeService } from '../../services/prime.service';
import { RapportProjet } from '../../../models/attribution-prime.model';
import { PaiementFormComponent } from '../../dialog/paiement-form/paiement-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
@Component({
  selector: 'app-projets-details',
  imports: [CommonModule, PaiementFormComponent, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './projets-details.component.html',
  styleUrl: './projets-details.component.scss'
})
export class ProjetsDetailsComponent {
  isLoading = false;
  rapport: RapportProjet | null = null;
  loading = true;
  error: string | null = null;
  showPaiementModal = false;
  selectedAttributionId: number | null = null;
  projetid:number | null = null;

  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private primeService: PrimeService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (!id) {

        console.error('ID projet invalide');
        return;
      }

      this.loadProjet(id);
    });
  }


  loadProjet(id:number): void {
    this.loading = true;
    this.error = null;

    this.primeService.getProjet(id).subscribe({
      next: (data) => {
        this.rapport = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
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

  getPourcentagePaiement(attribution: any): number {
    if (attribution.montant_prime === 0) return 0;
    return (attribution.montant_paye / attribution.montant_prime) * 100;
  }

  openPaiementModal(attributionId: number): void {
    this.selectedAttributionId = attributionId;
    this.showPaiementModal = true;
  }

  closePaiementModal(): void {
    this.showPaiementModal = false;
    this.selectedAttributionId = null;
  }

  onPaiementSuccess(): void {
    this.closePaiementModal();
    if (this.rapport?.projet.id) {
      this.loadProjet(this.rapport.projet.id);
    }
  }

  goBack(): void {
    this.router.navigate(['/primes/projets']);
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
        this.router.navigate(['/primes/projets']);
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

  supprimerPaiement(paiement: any, attribution: any) {
    if (!confirm('Voulez-vous vraiment supprimer ce paiement ?')) {
      return;
    }

    this.primeService.deletePaiement(paiement.slug).subscribe({
      next: () => {

        if (this.rapport?.projet.id) {
          this.loadProjet(this.rapport.projet.id);
        }

        this.snackBar.open(
          'Paiement supprimé avec succès',
          'Fermer',
          { duration: 3000 }
        );
      },
      error: (err) => {
        this.snackBar.open(
          err.error.message || 'Erreur lors de la suppression',
          'Fermer',
          { duration: 4000 }
        );
        console.error('Erreur de suppression de paiement', err);
      }
    });
  }

}
