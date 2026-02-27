import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  BureauModel,
  BureauModelPayload,
  BureauPreview,
} from '../../../../models/Caisse/bureau.model';
import { BureauService } from '../../../../services/Caisse/bureau.service';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-add-bureau',
  imports: [RouterLink, ReactiveFormsModule, LoaderComponent, LoaderComponent],
  templateUrl: './add-bureau.component.html',
  styleUrl: './add-bureau.component.scss',
})
export class AddBureauComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bureauService = inject(BureauService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  success = signal<boolean>(false);
  loader = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  bureauRfk = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  today = new Date().toLocaleDateString('fr-FR');

  bureauForm = this.fb.nonNullable.group({
    libelle: ['', [Validators.required, Validators.minLength(2)]],
    rue: [''],
    codepostal: [''],
    ville: ['', [Validators.required, Validators.minLength(2)]],
    pays: ['', [Validators.required, Validators.minLength(2)]],
    complement: [''],
  });

  preview = signal<BureauPreview>({
    libelle: '',
    rue: '',
    complement: '',
    codepostal: '',
    ville: '',
    pays: '',
  });

  ngOnInit(): void {
    // Preview temps réel
    this.bureauForm.valueChanges.subscribe((val) => {
      this.preview.set({
        libelle: val.libelle || '',
        rue: val.rue || '',
        complement: val.complement || '',
        codepostal: val.codepostal || '',
        ville: val.ville || '',
        pays: val.pays || '',
      });
    });

    // Détection mode édition
    const rfk = this.route.snapshot.paramMap.get('rfk');
    this.bureauRfk.set(rfk);

    if (rfk) {
      this.isEditMode.set(true);
      this.loadBureau(rfk);
    }
  }

  private loadBureau(rfk: string): void {
    this.loader.set(true);

    this.bureauService.getOne(rfk).subscribe({
      next: (data) => {
        // Pré-remplissage du formulaire
        this.bureauForm.patchValue({
          libelle: data.libelle ?? '',
          rue: data.rue ?? '',
          codepostal: data.codepostal ?? '',
          ville: data.ville ?? '',
          pays: data.pays ?? '',
          complement: data.complement ?? '',
        });
        this.loader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur lors du chargement',
        );
        this.loader.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.bureauForm.invalid) {
      this.bureauForm.markAllAsTouched();
      return;
    }

    const formValue = this.bureauForm.getRawValue();

    const payload: BureauModelPayload = {
      libelle: formValue.libelle,
      rue: formValue.rue || null,
      codepostal: formValue.codepostal || null,
      ville: formValue.ville,
      pays: formValue.pays,
      complement: formValue.complement || null,
    };

    this.loader.set(true);

    const request$ = this.isEditMode()
      ? this.bureauService.update(this.bureauRfk()!, payload)
      : this.bureauService.create(payload);

    request$.subscribe({
      next: () => {
        this.loader.set(false);
        this.success.set(true);

        if (!this.isEditMode()) {
          this.resetForm();
        }

        this.router.navigate(['/caisse/bureaux']);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.loader.set(false);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  resetForm(): void {
    this.bureauForm.reset();
  }

  isInvalidField = (inputName: string): boolean => {
    const input = this.bureauForm.get(inputName);
    return input ? input.invalid && (input.dirty || input.touched) : false;
  };
}
