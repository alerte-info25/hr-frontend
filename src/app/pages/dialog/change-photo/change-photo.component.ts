  import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../material.module';
import { AuthService } from '../../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-change-photo',
  imports: [MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-photo.component.html',
  styleUrl: './change-photo.component.scss'
})
export class ChangePhotoComponent {
  user: any;
  preview: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  isLoading: boolean=false;
  constructor(
    private fb: FormBuilder,
    private authSvr: AuthService,
    private snack: MatSnackBar,
    private dialogRef: MatDialogRef<ChangePhotoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.user = data.user;
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => this.preview = reader.result;
      reader.readAsDataURL(file); // <-- pas de null ici
    }
  }



  submit() {
    const payload = {
      'slug': this.user.employe.slug,
      'photo': this.preview
    }
    this.authSvr.changePhoto(payload).subscribe({
        next: (res: any) => {
         const message = res?.message || 'Photo mis à jour.';
          this.snack.open(message, 'Fermer', { duration: 3000 });
          const photo = res.data;
          this.authSvr.updateUserPhoto(photo);
          this.isLoading = false;
          this.closeModal();
          // const photo = res.data
          // const storedUser = localStorage.getItem('user_token')
          // if (storedUser) {
          //   const userObj = JSON.parse(storedUser);
          //   userObj.employe.photo = photo;

          //   localStorage.setItem('user_token', JSON.stringify(userObj));
          // }


        },
        error: (err) => {
          console.error(err);
          this.snack.open(err?.message ||'Erreur lors de la mise a jour de la photo.', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });

  }
  closeModal(){
    this.dialogRef.close(true);
  }
}
