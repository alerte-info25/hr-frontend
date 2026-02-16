import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-code-verification-dialog',
  imports: [MaterialModule, FormsModule, ReactiveFormsModule, CommonModule],
  template: `
    <div [ngClass]="{'shake-error': errorMessage}">
      <h2 mat-dialog-title>Vérification du code</h2>
      <mat-dialog-content>
        <p>Veuillez saisir votre code d'auto-enregistrement :</p>
        <mat-form-field appearance="fill" class="w-100">
          <mat-label>Code</mat-label>
          <input matInput [(ngModel)]="code" [class.invalid-input]="errorMessage"/>
        </mat-form-field>

        <p *ngIf="errorMessage" class="text-danger mt-2">{{ errorMessage }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Annuler</button>
        <button mat-raised-button color="primary" (click)="submitCode()">Valider</button>
      </mat-dialog-actions>
    </div>

  `,
  styles: `
    .shake-error {
      animation-name: shake;
      animation-duration: 0.5s;
    }
  `

})
export class CodeVerificationDialogComponent {
  code: string = '';
  errorMessage: string = '';

  // Déclarer une fonction publique que le parent peut assigner
  public onSubmit: ((code: string) => void) | null = null;

  constructor(public dialogRef: MatDialogRef<CodeVerificationDialogComponent>) {}

  submitCode() {
    if (!this.code) {
      this.errorMessage = 'Veuillez entrer un code';
      return;
    }

    // Appelle la fonction assignée par le parent
    if (this.onSubmit) {
      this.onSubmit(this.code);
    }
  }

  setError(message: string) {
    this.errorMessage = message;

    // Re-trigger animation shake
    const content = document.querySelector('mat-dialog-content') as HTMLElement | null;
    if (content) {
      content.classList.remove('shake-error');
      void content.offsetWidth; // force reflow
      content.classList.add('shake-error');
    }
  }


}
