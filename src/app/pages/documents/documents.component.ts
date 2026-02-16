import { Component, OnInit } from '@angular/core';
import { DocumentsService } from '../../services/documents.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-documents',
  imports: [CommonModule, LoadingComponent],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.scss'
})
export class DocumentsComponent implements OnInit{
  listeEmploye:any[]=[];
  isLoading: boolean = true;
  user: any;
  constructor(
    private docSvr: DocumentsService,
    private snackBar: MatSnackBar,
    private router: Router,
    private authSvr: AuthService
  ){

  }
  ngOnInit(): void {
    this.user = this.authSvr.getCurrentUser();
    this.refresh();
  }

  refresh(){
    this.isLoading = true
    this.docSvr.getListEmploye().subscribe({
      next: (data) => {
        this.listeEmploye = data
        this.isLoading = false
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la récupération des dossiers', 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    })
  }
  openEmployeeFolder(employe: any) {
    this.router.navigate([`/dossier/${employe.slug}`],{
      state: { nom: employe.nom, prenom: employe.prenom }
    });
  }

}
