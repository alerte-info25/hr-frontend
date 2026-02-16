import { Component } from '@angular/core';
import { RegisterCodesService } from '../../services/register-codes.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-register-codes',
  imports: [CommonModule, DatePipe],
  templateUrl: './register-codes.component.html',
  styleUrl: './register-codes.component.scss'
})
export class RegisterCodesComponent {
  isLoading: boolean = false;
  registerCodes: any[] = [];

  constructor(
    private registerCodesService: RegisterCodesService,
    private snackBar: MatSnackBar
  ) { }

  refresh(){
    this.isLoading = true;
    this.registerCodesService.getList().subscribe({
      next: (data) => {
        this.registerCodes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récuperations des codes', error);
        this.snackBar.open(error.message || 'Erreur lors de la récuperations des codes', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        this.isLoading = false;
      }
    });
  }
  generateCode(){
    this.isLoading = true;
    this.registerCodesService.generateCode().subscribe({
      next: (data) => {
        this.snackBar.open(data.message || 'Code généré avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.refresh();
      },
      error: (error) => {
        console.error('Erreur lors de la génération du code', error);
        this.snackBar.open(error.message || 'Erreur lors de la génération du code', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        this.isLoading = false;
      }
    });
  }

  ngOnInit(){
    this.refresh();
  }
  get canGenerate(): boolean {
    return this.registerCodes.length === 0;
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      this.snackBar.open('Code copié dans le presse-papiers', 'Fermer', {
        duration: 2000,
        panelClass: ['snackbar-success']
      });
    }).catch(err => {
      this.snackBar.open('Erreur lors de la copie du code', 'Fermer', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      console.error('Erreur copie :', err);
    });
  }

}
