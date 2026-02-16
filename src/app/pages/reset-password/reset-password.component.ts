import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.developpement';
import { MaterialModule } from '../../../../material.module';
@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  resetForm!: FormGroup;
  token!: string;
  email!: string;
  isLoading = false;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private http: HttpClient,
  ) {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      form.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }
  ngOnInit(): void {
    // Récupérer token et email depuis l'URL
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
    });

    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validator: this.passwordMatchValidator });
  }
  submit() {
    if (this.resetForm.invalid) return;

    this.isLoading = true;
    this.http.post(`${environment.apiUrl}reset-password`, {
      email: this.email,
      token: this.token,
      password: this.resetForm.value.password,
      password_confirmation: this.resetForm.value.confirmPassword
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.snackBar.open(res.message || 'Mot de passe réinitialisé ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
        this.router.navigate(['/connexion']);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Erreur lors de la réinitialisation', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        this.errorMessage = err.error.message || 'Erreur lors de la réinitialisation';
      }
    });
  }
}
