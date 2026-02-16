import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployesService } from '../../../services/employes.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-details-empleoye',
  imports: [CommonModule, RouterLink, LoadingComponent,ConfirmDeleteDialogComponent],
  templateUrl: './details-employe.component.html',
  styleUrl: './details-employe.component.scss'
})
export class DetailsEmployeComponent {
  daysRemaining: number = 0;
  theEmployee: any;
  isLoading = true;
  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeSvr: EmployesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const slug:string|null = this.route.snapshot.paramMap.get('id');
    if (slug) {
      this.employeSvr.getEmployesBySlug(slug).subscribe({
        next: (data) =>{
          this.theEmployee = data
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open('Erreur lors de la recuperation de l\'employe{', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-warning']
          })
        }
      })

    }
  }

  goBack() {
    this.router.navigate(['/employes']);
  }

  getInitials(): string {
    if (!this.theEmployee) return '';
    const nom = this.theEmployee.nom || '';
    const prenom = this.theEmployee.prenom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }



  // SUPPRESSION

   openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

    confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.employeSvr.deleteEmployes(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.router.navigate(['/employes'])
        this.snackBar.open('Employé supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        // this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression de l\'employé ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }

  getLabelGenre(genre: string): string {
    switch (genre) {
      case 'm':
        return 'Masculin';
      case 'f':
        return 'Féminin';
      default:
        return 'Autre';
    }
  }
  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
  calculateDaysRemaining(dateFin: string): number {
    if (!dateFin || dateFin == null) return 0;
    const today = new Date();
    const end = new Date(dateFin);
    const diff = end.getTime() - today.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 3600 * 24)) : 0;
  }
}
