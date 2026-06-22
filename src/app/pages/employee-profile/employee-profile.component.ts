import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../dialog/change-password-dialog/change-password-dialog.component';
import { MaterialModule } from '../../../../material.module';
import { ChangePhotoComponent } from '../dialog/change-photo/change-photo.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-profile',
  imports: [MaterialModule, CommonModule],
  templateUrl: './employee-profile.component.html',
  styleUrl: './employee-profile.component.scss'
})
export class EmployeeProfileComponent {
  user: any;
  slug: string ='';
  daysRemaining: number = 0;
  constructor(
    private authSvr: AuthService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {

    const userData = localStorage.getItem('user_token');
    if (userData) {
      this.user = JSON.parse(userData);
      const fin = this.user?.employe?.contrat?.fin;
        if (fin) {
          this.daysRemaining = this.calculateDaysRemaining(fin);
        }
      this.slug = this.user?.employe?.slug;
    }
  }
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  editProfile(): void {
    this.dialog.open(ChangePhotoComponent, {
      width: 'auto',
      data: { user: this.user }
    });
  }

  changePassword(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: 'auto',
      data: { user: this.user }
    });
  }
  calculateDaysRemaining(dateFin: string): number {
    const today = new Date();
    const end = new Date(dateFin);
    const diff = end.getTime() - today.getTime();
    return diff > 0 ? Math.ceil(diff / (1000 * 3600 * 24)) : 0;
  }

  editInfos(){
    this.router.navigate(['edit-employe/',this.slug])
  }

  copyMatricule() {
    const matricule = this.user?.employe?.matricule;
    if (matricule) {
      navigator.clipboard.writeText(matricule).then(() => {
        this.snackBar.open('Matricule copié dans le presse-papiers!', 'Fermer', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }).catch(err => {
        this.snackBar.open('Erreur lors de la copie', 'Fermer', {
          duration: 2000
        });
      });
    }
  }
}
