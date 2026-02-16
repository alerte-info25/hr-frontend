import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentsService } from '../../services/documents.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MaterialModule } from "../../../../material.module";
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { Location } from '@angular/common';
@Component({
  selector: 'app-dossiers',
  imports: [CommonModule, MatProgressSpinnerModule, MaterialModule, ConfirmDeleteDialogComponent],
  templateUrl: './dossiers.component.html',
  styleUrl: './dossiers.component.scss'
})
export class DossiersComponent implements OnInit{
  showConfirmModal = false;
  itemToDelete: any = null;
  isLoading = true;
  slug:any;
  nomEmploye:string ='';
  prenomEmploye:string='';
  dossiers:any[]=[];
  constructor(
    private docSvr: DocumentsService,
    private route:ActivatedRoute,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private location: Location
  ){}
  ngOnInit(): void {
    this.isLoading = true;
    this.slug = this.route.snapshot.paramMap.get('id');
    const state = window.history.state;
    this.nomEmploye = state.nom || '';
    this.prenomEmploye = state.prenom || '';
      if (this.slug) {
      this.refresh(this.slug)
    }
  }
  refresh(slug:string){
    this.docSvr.getDossierByEmp(slug).subscribe({
        next: (data) =>{
          this.dossiers = data;
          this.isLoading = false
        },
        error:(err)=>{
          this.isLoading = false
          this.snackBar.open(err.message, 'Fermer', {
            duration: 4000,
            panelClass: ['toast-error']
          });
        }
      })
  }

  openFile(url: string): void {
    window.open(url, '_blank');
  }

  downloadFile(url: string, name: string): void {
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement:', error);
        this.snackBar.open('Échec du téléchargement du fichier ❌', 'Fermer', {
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
        title: 'un fichier',
        fields: [
          { name: 'nomFichier', label: 'Nom du fichier', type: 'text', validators: ['required'] },
          { name: 'document', label: 'Document', type: 'file2' }
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        // const payload = {
        //   id_employe: this.id_employe,
        //   id_type: formData.get('type'),
        //   date_demande: formData.get('dateDemande'),
        //   debut: formData.get('startDate'),
        //   fin: formData.get('endDate'),
        //   raison: formData.get('reason'),
        //   document: formData.get('document')
        // };
        formData.append('id_employe', this.slug);

        this.docSvr.addFichier(formData).subscribe({
            next: (res) => {
              this.isLoading = false;
              this.refresh(this.slug);

              // ✅ Toast de succès
              this.snackBar.open('Fichier enregistrée avec succès ✅', 'Fermer', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['snackbar-success']
              });
            },
            error: (err) => {
              this.isLoading = false;

              // ❌ Toast d’erreur
              this.snackBar.open('Échec de l’enregistrement du fichier ❌', 'Fermer', {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['snackbar-error']
              });
              console.error(err);
            }
          });
        }
    });
  }

  goToList(){
    // this.router.navigate(['/dossiers'])
    this.location.back();
  }

   // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.docSvr.deleteFichier(this.itemToDelete.slug).subscribe({
      next: (res) => {
        this.closeModal();
        this.isLoading = false;
        this.refresh(this.slug);

        // ✅ Toast de succès
        this.snackBar.open('Fichier supprimer avec succès ✅', 'Fermer', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        // ❌ Toast d’erreur
        this.snackBar.open('Échec lors de la suppression du fichier ❌', 'Fermer', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    });
  }
  // Ferme le modal sans supprimer
  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
}
