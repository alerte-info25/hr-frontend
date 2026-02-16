import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { DroitsService } from '../../services/droits.service';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';
import { DroitFormsDialogComponent } from '../dialog/droit-forms-dialog/droit-forms-dialog.component';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-droits',
  imports: [CommonModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './droits.component.html',
  styleUrl: './droits.component.scss'
})
export class DroitsComponent {
  showConfirmModal = false;
  itemToDelete: any = null;
  isLoading = true;
  droits: any[] = [];
  modules:any[]=[
    {value:'employes',nom:'Employés'},
    {value:'services',nom:'Services'},
    {value:'contrats',nom:'Contrats'},
    {value:'caisse',nom:'Caisse'},
    {value:'type_contrat',nom:'Type des contrats'},
    {value:'permissions',nom:'Permissions'},
    {value:'type_permissions',nom:'Type des permissions'},
    {value:'fonction',nom:'Fonction'},
    {value:'conges',nom:'Congés'},
    {value:'type_conges',nom:'Type des congés'},
    // {value:'bureaux',nom:'Bureaux'},
    {value:'taches',nom:'Tâches'},
    {value:'dossiers',nom:'Dossiers'},
    {value:'utilisateurs',nom:'Utilisateurs'},
    {value:'droits',nom:'Droits'},
    {value:'roles',nom:'Rôles'},
    {value: 'codes', nom:'Codes'},
    {value: 'objets', nom:'Objets des demandes d\'explication'},
    {value: 'sanctions', nom: 'Sanctions disciplinaire'},
    {value: 'primes', nom: 'Primes'},
  ];
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private droitSvr: DroitsService,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit(): void {
    this.refresh()
   }
  refresh(){
    this.isLoading = true;
    this.droitSvr.getListeDroit().subscribe({
      next: (data) => {
        this.droits = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
        console.error('Erreur', err);
      }
    })
  }

  openDroitDialog(droit?: any): void {
  this.droitSvr.getListeRole().subscribe({
    next: (roles) => {
      const dialogRef = this.dialog.open(DroitFormsDialogComponent, {
        width: 'auto',
        data: {
          item: droit,
          modules: this.modules,
          roles: roles
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (!result) return;

        if (droit) {
          // Modifier le droit
          this.droitSvr.updateDroit(droit.slug, result).subscribe(() => this.refresh());
        } else {
          // Ajouter un droit
          this.droitSvr.addDroit(result).subscribe(() => this.refresh());
        }
      });
    },
    error: (err) => console.error('Erreur lors de la récupération des rôles', err)
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

    this.droitSvr.deleteDroit(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.refresh();
        this.snackBar.open('Droits supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.closeModal();
        this.snackBar.open('Echec lors de la suppression des droits ❌', 'Fermer', {
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
