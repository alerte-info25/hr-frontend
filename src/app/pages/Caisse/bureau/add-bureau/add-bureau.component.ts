import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';
import { BureauService } from '../../../../services/Caisse/bureau.service';
import {
  BureauModel,
  BureauPayload,
} from '../../../../models/Caisse/bureau.model';

@Component({
  selector: 'app-add-bureau',
  imports: [RouterLink, ReactiveFormsModule, LoaderComponent],
  templateUrl: './add-bureau.component.html',
  styleUrl: './add-bureau.component.scss',
})
export class AddBureauComponent implements OnInit {
  fb = inject(FormBuilder);
  bureauService = inject(BureauService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // mode edit / update
  bureaurfk = signal<string | null>(null);
  isEditMode = signal<boolean | null>(null);
  bureau = signal<BureauModel | null>(null);

  // etats
  success = signal(false);
  loader = signal(false);
  errorMessage = signal<string | null>(null);

  // date
  today = new Date().toLocaleDateString('fr-Fr');

  bureauForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    ville: ['', [Validators.required, Validators.minLength(2)]],
    pays: ['', [Validators.required, Validators.minLength(2)]],
    adresse: [''],
    codepostal: [''],
    complement: [''],
  });

  preview = signal<BureauPayload>({
    nom: '',
    ville: '',
    pays: '',
    adresse: '',
    codepostal: '',
    complement: '',
  });

  ngOnInit(): void {
    this.bureauForm.valueChanges.subscribe((val) => {
      this.preview.set({
        nom: val.nom || '',
        ville: val.ville || '',
        pays: val.pays || '',
        adresse: val.adresse || '',
        codepostal: val.codepostal || '',
        complement: val.complement || '',
      });
    });

    const rfk = this.route.snapshot.paramMap.get('rfk');
    this.bureaurfk.set(rfk);
    if (rfk) {
      this.isEditMode.set(true);
      this.bureaurfk.set(rfk);
      this.loadBureau(this.bureaurfk()!);
    }
  }

  private loadBureau(rfk: string) {
    this.loader.set(true);
    this.bureauService.getOne(rfk).subscribe({
      next: (data) => {
        this.loader.set(false);
        this.success.set(true);

        this.bureau.set(data);

        this.bureauForm.patchValue({
          nom: data.nom,
          ville: data.ville,
          pays: data.pays,
          adresse: data.adresse ?? '',
          codepostal: data.codepostal ?? '',
          complement: data.complement ?? '',
        });

        setTimeout(() => {
          this.success.set(false);
        }, 3000);
      },
      error: (err) => {
        this.loader.set(false);
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
      },
    });
  }

  onSubmit() {
    if (this.bureauForm.invalid) {
      this.bureauForm.markAllAsTouched();
      return;
    }

    const formValue = this.bureauForm.getRawValue();

    const payload: BureauPayload = {
      nom: formValue.nom,
      ville: formValue.ville,
      pays: formValue.pays,
      adresse: formValue.adresse,
      complement: formValue.complement,
      codepostal: formValue.codepostal,
    };

    if (this.isEditMode()) {
      this.bureauService.update(this.bureaurfk()!, payload).subscribe({
        next: () => {
          this.loader.set(true);
          this.success.set(true);
          this.router.navigate(['/caisse/bureaux']);

          setTimeout(() => {
            this.loader.set(false);
            this.success.set(false);
          }, 3000);
        },
        error: (err) => {
          this.loader.set(false);
          this.errorMessage.set(
            err.error?.message ?? 'erreur lors de la mise à jour',
          );
        },
      });
    } else {
      this.loader.set(true);

      this.bureauService.create(payload).subscribe({
        next: () => {
          this.loader.set(false);
          this.success.set(true);

          setTimeout(() => {
            this.success.set(false);
          }, 3000);

          this.router.navigate(['/caisse/bureaux']);
        },
        error: (err) => {
          this.loader.set(false);
          this.errorMessage.set(
            err.error?.message ??
              'Une erreur est survenue lors de la soumission du formulaire',
          );
        },
      });
    }
  }

  resetForm() {
    this.bureauForm.reset();
  }

  isInvalidField(inputName: string) {
    const inputField = this.bureauForm.get(inputName);
    return inputField
      ? inputField.invalid && (inputField.dirty || inputField.touched)
      : false;
  }
}
