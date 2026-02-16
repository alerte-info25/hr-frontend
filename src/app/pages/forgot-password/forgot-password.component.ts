import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.developpement';
import { MaterialModule } from "../../../../material.module";

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(private http: HttpClient, private snackBar: MatSnackBar, private router: Router) {}

  sendResetLink() {
    if (!this.email) {
      this.errorMessage = 'Veuillez renseigner votre email';
      return;
    }

    this.loading = true;
    this.http.post(`${environment.apiUrl}forgot-password`, { email: this.email })
      .subscribe({
        next: (res: any) => {
          this.loading = false;
          this.snackBar.open(res.message || 'Lien envoyé ✅', 'Fermer', { duration: 3000 });
          this.router.navigate(['/connexion']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error.message || 'Erreur lors de l’envoi';
        }
      });
  }
}
