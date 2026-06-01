import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BureauxService } from '../../services/bureaux.service';
import { InfrasLoadingComponent } from '../infras-loading/infras-loading.component';

@Component({
  selector: 'app-infras-bureaux',
  imports: [InfrasLoadingComponent],
  templateUrl: './infras-bureaux.component.html',
  styleUrl: './infras-bureaux.component.scss'
})
export class InfrasBureauxComponent {
  bureaux: any[] = [];
  isLoading = true;
  constructor(
    private bureauSvr: BureauxService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(){
    this.bureauSvr.getAll().subscribe({
      next: (data) => {
        this.bureaux = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des bureaux', err);
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    })
  }

  synchronize() {
    this.isLoading = true;
    this.bureauSvr.sync().subscribe({
      next: (data) => {
        this.snackBar.open('Synchronisation réussie ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.refresh();
      },
      error: (err) => {
        console.error('Erreur de synchronisation', err);
        this.isLoading = false;
        this.snackBar.open('Echec de la synchronisation ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }
}
