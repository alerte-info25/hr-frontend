import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../../material.module';
import { FormsDialogComponent } from '../../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { NATIONALITES } from '../../../../data/nationnalite';
import { PAYS } from '../../../../data/pays';
import { CodeVerificationDialogComponent } from '../../dialog/code-verify/code-verify-dialog.component';
import { RegisterCodesService } from '../../../services/register-codes.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  isLoading:boolean = false;
  passwordVisible: boolean = false;
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  constructor(
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authSvr: AuthService,
    private registerCodeSvr: RegisterCodesService
  ) { }


  goToForgot() {
    this.router.navigate(['forgot-password']);
  }

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }


  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage='Veuillez renseigné tous les champs !!'
      return;
    }
    this.isLoading = true;
    const data = {'email':this.email, 'password':this.password}
    this.auth.login(data).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open('Connexion réussie 🎉', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        const role = res.user?.role?.libelle?.toLowerCase();

        if (role === 'rh' || role === 'directeur') {
          this.router.navigate(['']);
        } else {
          this.router.navigate(['/applications']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
        this.errorMessage = err.error.message || 'Erreur de connexion';
      }
    })
  }

  openAutoRegister(): void {
    const codeDialogRef = this.dialog.open(CodeVerificationDialogComponent, { width: '400px' });
    const instance = codeDialogRef.componentInstance;

    instance.onSubmit = (code: string) => {
      this.registerCodeSvr.verifyRegisterCode(code).subscribe({
        next: (res: any) => {
          if (res.valid) {
            codeDialogRef.close(); // code valide → fermer le modal
            this.openFormDialog();
          } else {
            instance.setError(res.message || 'Code invalide ❌'); // code invalide → reste ouvert
          }
        },
        error: (err: any) => {
          instance.setError('Erreur lors de la vérification'); // reste ouvert
          console.error(err);
        }
      });
    };

  }


  private openFormDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: '600px',
      data: {
        title: 'un employé (Auto-enregistrement)',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'prenom', label: 'Prénom', type: 'text', validators: ['required'] },
          { name: 'emailPersonnel', label: 'Email', type: 'email', validators: ['required', 'email'] },
          {name: 'genre',label: 'Genre',type: 'select2',
            options: [
              { label: 'Masculin', value: 'm' },
              { label: 'Féminin', value: 'f' }
            ],
            validators: ['required']
          },
          { name: 'nationalite', label: 'Nationalité', type: 'select', options: NATIONALITES.map(n => n.nom), validators: ['required'] },
          { name: 'telephone', label: 'Téléphone', type: 'tel' , validators: ['required']},
          { name: 'dateNaissance', label: 'Date de naissance', type: 'date' , validators: ['required']},
          { name: 'lieuNaissance', label: 'Lieu de naissance', type: 'text' , validators: ['required']},
          { name: 'paysResidence', label: 'Pays de résidence', type: 'select', options: PAYS.map(n => n.nom), validators: ['required'] },
          { name: 'adresse', label: 'Adresse physique', type: 'textarea' , validators: ['required']}
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading = true;
        this.authSvr.autoRegister(formData).subscribe({
          next: (mes: any) => {
            this.snackBar.open(mes.message, 'Fermer', {
              duration: 4000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['snackbar-success']
            });
            this.isLoading = false;
          },
          error: (err: any) => {
            this.snackBar.open('Échec de l’auto-enregistrement ❌', 'Fermer', {
              duration: 4000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['snackbar-error']
            });
            this.isLoading = false;
            console.error(err);
          }
        });
      }
    });
  }


}
