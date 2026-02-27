import {
  Component,
  inject,
  input,
  Input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CompteComptableModel,
  CompteComptablePayload,
} from '../../../../../models/Caisse/compte-comptable.model';
import { CompteComptableService } from '../../../../../services/Caisse/compte-comptable.service';
import { ClasseComptableService } from '../../../../../services/Caisse/classe-comptable.service';
import { TypeCompteComptableService } from '../../../../../services/Caisse/type-compte-comptable.service';
import { CategorieComptableService } from '../../../../../services/Caisse/categorie-comptable.service';
import { ClasseComptableModel } from '../../../../../models/Caisse/classe-compte-model';
import { TypeCompteComptableModel } from '../../../../../models/Caisse/type-compte-comptable.model';
import { CategorieComptableModel } from '../../../../../models/Caisse/categorie-comptable.model';
import { LoaderComponent } from '../../../../../sharedCaisse/components/loader/loader.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-form',
  imports: [ReactiveFormsModule, LoaderComponent],
  templateUrl: './form.component.html',
  styles: ``,
})
export class FormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router)

  private compteService = inject(CompteComptableService);
  private classeService = inject(ClasseComptableService);
  private typeService = inject(TypeCompteComptableService);
  private categorieService = inject(CategorieComptableService);

  // Données pour les selects
  classes = signal<ClasseComptableModel[]>([]);
  types = signal<TypeCompteComptableModel[]>([]);
  categories = signal<CategorieComptableModel[]>([]);

  // États
  loading = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);

  // récupération des données du compte à update
  comptecomptable = input<CompteComptableModel | null>(null);

  compteComptableForm = this.fb.nonNullable.group({
    numero: ['641300', [Validators.required, Validators.pattern(/^\d+$/)]],
    libelle: ['Primes développeurs', [Validators.required]],
    classe_comptable_rfk: ['', [Validators.required]],
    type_compte_comptable_rfk: ['', [Validators.required]],
    categorie_comptable_rfk: ['', [Validators.required]],
    description: [
      "Primes et gratifications exceptionnelles pour l'équipe de développement",
      [Validators.required],
    ],
    actif: [true],
  });

  ngOnInit(): void {
    this.loadSelect();

    const compte = this.comptecomptable();

    if (compte) {
      this.compteComptableForm.patchValue({
        numero: compte.numero,
        libelle: compte.libelle,
        classe_comptable_rfk: compte.classe_comptable?.rfk,
        type_compte_comptable_rfk: compte.type_compte_comptable?.rfk,
        categorie_comptable_rfk: compte.categorie_comptable?.rfk,
        description: compte.description,
        actif: compte.actif,
      });
    }
  }

  private loadSelect() {
    this.classeService.getAll().subscribe((data) => {
      this.classes.set(data);
    });

    this.typeService.getAll().subscribe((data) => {
      this.types.set(data);
    });

    this.categorieService.getAll().subscribe((data) => {
      this.categories.set(data);
    });
  }

  private updateCompte(rfk: string, compte: CompteComptablePayload) {
    this.loading.set(true);
    this.compteService.update(rfk, compte).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);

        setTimeout(() => {
          this.success.set(false);
        }, 3000);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error.message ?? 'Une erreur est survenue');
      },
    });
  }

  onSubmit(): void {
    if (this.compteComptableForm.invalid) {
      this.compteComptableForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const payload: CompteComptablePayload =
      this.compteComptableForm.getRawValue();

    const rfkExistante = this.comptecomptable()?.rfk;

    // mode edit
    if (rfkExistante) {
      this.updateCompte(rfkExistante, payload);
      this.router.navigate(["/caisse/comptes"])
    } else {
      // mode create
      this.compteService.create(payload).subscribe({
        next: () => {
          this.success.set(true);
          this.resetForm();
          this.loading.set(false);
          setTimeout(() => {
            this.success.set(false);
          }, 3000);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message ?? 'Une erreur est survenue.',
          );
          this.loading.set(false);
        },
      });
    }
  }

  resetForm(): void {
    this.compteComptableForm.reset({ actif: true });
    this.errorMessage.set(null);
  }

  isInvalidField = (inputName: string): boolean => {
    const input = this.compteComptableForm.get(inputName);
    return input ? input.invalid && (input.dirty || input.touched) : false;
  };
}
