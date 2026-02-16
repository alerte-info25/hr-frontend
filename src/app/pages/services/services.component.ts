import { Component } from '@angular/core';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServicesService } from '../../services/services.service';
import { EmployesService } from '../../services/employes.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-services',
  imports: [CommonModule, ConfirmDeleteDialogComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent {
  services: any[] = [];
  isLoading = true;
  showConfirmModal = false;
  itemToDelete: any = null;
  constructor(
    private dialog: MatDialog,
    private route: Router,
    private svrService:ServicesService,
    private empSvr: EmployesService,
    private snackBar: MatSnackBar
  ){}
    ngOnInit(): void {
      this.refresh()
    }

    refresh(){
      this.svrService.getList().subscribe({
          next: (data) => {
          this.services = data;
          this.isLoading = false;
          // this.snackBar.open(data.message,'Fermer',{
          //   duration: 4000,
          //   horizontalPosition: 'end',
          //   verticalPosition: 'top',
          //   panelClass: ['snackbar-error']
          // })
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(err.message,'Fermer',{
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['snackbar-error']
          })
          console.error('Erreur de chargement des services', err);
        }
      })
    }
    openAddDialog(): void {
      this.empSvr.getList().subscribe({
        next:(chef)=>{
          const dialogRef = this.dialog.open(FormsDialogComponent, {
            width: 'auto',
            data: {
              title: 'un service',
              fields: [
                { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
                { name: 'description', label: 'Description', type: 'textarea',validators: ['required']},
                { name: 'id_chef',
                  label: 'Chef du service',
                  type: 'select2',
                  options: chef.map(c => ({
                    value: c.slug, label: `${c.nom} ${c.prenom}`
                  }))
                }
              ]
            }
          });

          dialogRef.afterClosed().subscribe(formData => {
            this.isLoading = true;
            if (formData) {
              this.svrService.addService(formData).subscribe({
                next:(res)=>{
                  this.snackBar.open(res.message, 'Fermer', {
                    duration: 4000,
                    horizontalPosition: 'end',
                    verticalPosition: 'top',
                    panelClass: ['snackbar-success']
                  });
                  this.refresh()
                },
                error:(err) => {
                  this.isLoading = false;
                  this.snackBar.open(err.message,'Fermer', {
                    duration: 4000,
                    horizontalPosition: 'end',
                    verticalPosition: 'top',
                    panelClass: ['snackbar-error']
                  })
                }
              });
            }
          });
        }
      })
    }
    openEditDialog(service: any): void {
      this.empSvr.getList().subscribe({
        next:(chef)=>{
          const chefsDuService = chef.filter(e => e.id_service === service.slug || e.serviceSlug === service.slug);
          const dialogRef = this.dialog.open(FormsDialogComponent, {
            width: 'auto',
            data: {
              title: 'une service',
              item: service,
              fields: [
                { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
                { name: 'description', label: 'Description', type: 'textarea' },
                { name: 'id_chef',
                  label: 'Chef du service',
                  type: 'select2',
                  options: chefsDuService.map(c => ({
                    value: c.slug, label: `${c.nom} ${c.prenom}`
                  }))
                }
              ]
            }
          });

          dialogRef.afterClosed().subscribe(formData => {
            if (formData) {
              this.isLoading = true;
              this.svrService.updateService(service.slug, formData).subscribe({
                next:(res)=>{
                  this.snackBar.open(res.message, 'Fermer', {
                    duration: 4000,
                    horizontalPosition: 'end',
                    verticalPosition: 'top',
                    panelClass: ['snackbar-success']
                  });
                  this.refresh()
                },
                error:(err) => {
                  this.isLoading = false;
                  this.snackBar.open(err.message,'Fermer', {
                    duration: 4000,
                    horizontalPosition: 'end',
                    verticalPosition: 'top',
                    panelClass: ['snackbar-error']
                  })
                }
              })
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

      this.svrService.deleteService(this.itemToDelete.slug).subscribe({
        next: () => {
          this.closeModal();
          this.snackBar.open('Service supprimer avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });
          this.refresh();
          // this.isLoading = false;
        },
        error: (err) => {
          // this.isLoading = false;
          this.closeModal();
          this.snackBar.open('Echec lors de la suppression du service ❌', 'Fermer', {
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

