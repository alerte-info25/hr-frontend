import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { MaterialModule } from '../../../../../material.module';

@Component({
  selector: 'app-change-password-dialog',
  imports: [MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss'
})
export class ChangePasswordDialogComponent {
  passwordForm: FormGroup;
  hideOld = true;
  hideNew = true;
  hideConfirm = true;
  isLoading:boolean = false;
   constructor(
    private fb: FormBuilder,
    private authSvr: AuthService,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.passwordForm = this.fb.group({
      old_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }
  onSubmit() {
    if (this.passwordForm.invalid) return;

    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.snack.open("Les nouveaux mots de passe ne correspondent pas !", 'Fermer', { duration: 3000 });
      return;
    }
    this.isLoading = true;

    const payload = {
      old_password: this.passwordForm.value.oldPassword,
      new_password: this.passwordForm.value.newPassword,
      id_user: this.data.user.slug
    };
    this.authSvr.changePassword(payload).subscribe({
      next: (res: any) => {
        const message = res?.message || 'Mot de passe modifié avec succès.';
        this.snack.open(message, 'Fermer', { duration: 3000 });
        this.isLoading = false;
        this.closeModal();
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Ancien mot de passe incorrect.', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  closeModal(){
    this.dialogRef.close(true);
  }



}
