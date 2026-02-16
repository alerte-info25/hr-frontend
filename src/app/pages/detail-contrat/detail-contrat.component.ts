import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Contrats } from '../../../data/contrat';
import { CommonModule } from '@angular/common';
import { Employe } from '../../../data/employe';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ContratService } from '../../services/contrat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { FormContratDialogComponent } from '../dialog/form-contrat-dialog/form-contrat-dialog.component';

@Component({
  selector: 'app-detail-contrat',
  imports: [CommonModule, ConfirmDeleteDialogComponent],
  templateUrl: './detail-contrat.component.html',
  styleUrl: './detail-contrat.component.scss'
})
export class DetailContratComponent {
  showConfirmModal = false;
  itemToDelete: any = null;
    goBack() {
      this.router.navigate(['/contrats'])
    }
  theConrat:any;
  isLoading = true;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private contratSvr: ContratService,
    private snackBar: MatSnackBar
  ){
    const slug: string | null = this.route.snapshot.paramMap.get('id');
    if (slug) {

      this.contratSvr.getContratBySlug(slug).subscribe({
        next: (data) => {
          this.theConrat = data;
          this.isLoading = false;
        },
          error: (err) => {
          console.error('Erreur de chargement du contrat', err);
          this.isLoading = false;
        }
      })

    }
  }
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
  isContractExpired(contrat: any): boolean {
    const today = new Date();
    return new Date(contrat.dateFin) < today;
  }

  openEditDialog(contrat?: any) {
      const dialogRef = this.dialog.open(FormContratDialogComponent, {
        width: 'auto',
        data: contrat || null // si null => ajout, sinon modification
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.contratSvr.getContratBySlug(contrat.slug).subscribe({
            next: (data) => {
              this.theConrat = data;
              this.isLoading = false;
            },
              error: (err) => {
              console.error('Erreur de chargement du contrat', err);
              this.isLoading = false;
            }
          })
        }
      });
    }


  getTypeClass(type: string): string {
    switch (type) {
      case 'CDI': return "badge rounded-pill bg-success";
      case 'CDD': return "badge rounded-pill bg-primary";
      case 'FREELANCE': return "badge rounded-pill bg-dark";
      case 'INTERIM': return "badge rounded-pill bg-warning text-dark";
      case 'STAGE': return "badge rounded-pill bg-info text-dark";

      default:
        return "badge rounded-pill bg-secondary"

    }
  }
    getStatusClass(statut: number): string {
    switch(statut){
      case 1: return "badge rounded-pill bg-primary";break;
      case 2: return "badge rounded-pill bg-warning text-dark";break;
      case 3: return "badge rounded-pill bg-danger";break;
      case 4: return "badge rounded-pill bg-success";break;
      default:
        return "badge rounded-pill bg-secondary";
      break;
    }
  }
  getStatuLabel(statut: number){
    switch (statut) {
      case 1: return 'Actif';break;
      case 2: return 'Inactif';break;
      case 3: return 'Suspendu';break;
      case 4: return 'Terminer';break;
      default:
        return 'Inconnu';
        break;
    }
  }
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.contratSvr.deleteContrat(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Contrat supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression du contrat ❌', 'Fermer', {
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
