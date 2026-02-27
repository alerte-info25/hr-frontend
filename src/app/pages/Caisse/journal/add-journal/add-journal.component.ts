import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CompteComptableService } from '../../../../services/Caisse/compte-comptable.service';
import { OperationComptableService } from '../../../../services/Caisse/operation-comptable-service.service';
import { ExerciceComptableService } from '../../../../services/Caisse/exercice-comptable.service';
import { NatureOperationComptableService } from '../../../../services/Caisse/nature-operation-comptable.service';
import { CompteComptableModel } from '../../../../models/Caisse/compte-comptable.model';
import { BureauModel } from '../../../../models/Caisse/bureau.model';
import { ExerciceComptable } from '../../../../models/Caisse/exercice-comptable.model';
import { NatureOperationComptable } from '../../../../models/Caisse/nature-operation-comptable.model';
import { BureauService } from '../../../../services/Caisse/bureau.service';
import { OperationComptablePayload } from '../../../../models/Caisse/operation-comptable.model';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-add-journal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './add-journal.component.html',
  styleUrl: './add-journal.component.scss',
})
export class AddJournalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private operationService = inject(OperationComptableService);
  private compteService = inject(CompteComptableService);
  private bureauService = inject(BureauService);
  private natureService = inject(NatureOperationComptableService);
  private exerciceService = inject(ExerciceComptableService);

  // États
  loader = signal(false);
  loaderSelects = signal(false);
  success = signal(false);
  errorMessage = signal<string | null>(null);

  // Données selects
  comptes = signal<CompteComptableModel[]>([]);
  bureaux = signal<BureauModel[]>([]);
  natures = signal<NatureOperationComptable[]>([]);
  exercices = signal<ExerciceComptable[]>([]);

  // Pièce jointe
  pieceJointe = signal<File | null>(null);
  pieceJointeNom = signal<string | null>(null);

  // Totaux
  totaux = signal({ totalDebit: 0, totalCredit: 0, difference: 0 });

  journalForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadSelects();
  }

  initForm(): void {
    this.journalForm = this.fb.group({
      date_operation: [
        new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      libelle: ['', Validators.required],
      bureau_rfk: ['', Validators.required],
      nature_operation_comptable_rfk: ['', Validators.required],
      exercice_comptable_rfk: ['', Validators.required],
      service_rfk: [''],
      employe_rfk: [null],
      lignes: this.fb.array([this.createLigne(), this.createLigne()]),
    });

    // Souscription rattachée au nouveau form
    this.lignes.valueChanges.subscribe(() => this.calculerTotaux());

    // Remet les totaux à zéro
    this.totaux.set({ totalDebit: 0, totalCredit: 0, difference: 0 });
  }

  private loadSelects(): void {
    this.loaderSelects.set(true);

    forkJoin({
      comptes: this.compteService.getAll(),
      bureaux: this.bureauService.getAll(),
      natures: this.natureService.getAll(),
      exercices: this.exerciceService.getAll(),
    }).subscribe({
      next: (data) => {
        this.comptes.set(data.comptes);
        this.bureaux.set(data.bureaux);
        this.natures.set(data.natures);
        this.exercices.set(data.exercices);
        this.loaderSelects.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur de chargement des données',
        );
        this.loaderSelects.set(false);
      },
    });
  }

  // FormArray lignes
  get lignes(): FormArray {
    return this.journalForm.get('lignes') as FormArray;
  }

  createLigne(): FormGroup {
    return this.fb.group(
      {
        compte_comptable_rfk: ['', Validators.required],
        libelle: ['', Validators.required],
        montant_debit: [null],
        montant_credit: [null],
      },
      {
        validators: [this.debitOuCreditObligatoire()],
      },
    );
  }

  debitOuCreditObligatoire() {
    return (group: AbstractControl) => {
      const debit = Number(group.get('montant_debit')?.value) || 0;
      const credit = Number(group.get('montant_credit')?.value) || 0;

      return debit > 0 || credit > 0 ? null : { montantRequis: true };
    };
  }

  ajouterLigne(): void {
    this.lignes.push(this.createLigne());
  }

  supprimerLigne(index: number): void {
    if (this.lignes.length > 2) {
      this.lignes.removeAt(index);
    } else {
      alert('Une opération doit comporter au moins deux lignes.');
    }
  }

  onMontantChange(
    index: number,
    champ: 'montant_debit' | 'montant_credit',
  ): void {
    const ligne = this.lignes.at(index) as FormGroup;
    const valeur = ligne.get(champ)?.value;

    if (valeur && valeur > 0) {
      const autreChamp =
        champ === 'montant_debit' ? 'montant_credit' : 'montant_debit';
      ligne.get(autreChamp)?.setValue(null, { emitEvent: false });
    }
  }

  // Totaux
  calculerTotaux(): void {
    let totalDebit = 0;
    let totalCredit = 0;

    this.lignes.controls.forEach((ligne) => {
      totalDebit += Number(ligne.get('montant_debit')?.value) || 0;
      totalCredit += Number(ligne.get('montant_credit')?.value) || 0;
    });

    this.totaux.set({
      totalDebit,
      totalCredit,
      difference: totalDebit - totalCredit,
    });
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(
      montant,
    );
  }

  // Pièce jointe
  changerPieceJointe(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.pieceJointe.set(file);
        this.pieceJointeNom.set(file.name);
      }
    };

    input.click();
  }

  // Soumission
  onSubmit(): void {
    if (this.journalForm.invalid) {
      this.journalForm.markAllAsTouched();
      return;
    }

    const { difference } = this.totaux();
    if (difference !== 0) {
      this.errorMessage.set(
        "L'écriture n'est pas équilibrée (débit ≠ crédit).",
      );
      setTimeout(() => this.errorMessage.set(null), 4000);
      return;
    }

    const formValue = this.journalForm.getRawValue();

    const payload: OperationComptablePayload = {
      date_operation: formValue.date_operation,
      libelle: formValue.libelle,
      bureau_rfk: formValue.bureau_rfk,
      service_rfk: formValue.service_rfk,
      nature_operation_comptable_rfk: formValue.nature_operation_comptable_rfk,
      exercice_comptable_rfk: formValue.exercice_comptable_rfk,
      employe_rfk: formValue.employe_rfk || null,
      lignes: formValue.lignes.map((l: any) => ({
        compte_comptable_rfk: l.compte_comptable_rfk,
        libelle: l.libelle || null,
        montant_debit: l.montant_debit || 0,
        montant_credit: l.montant_credit || 0,
      })),
    };

    this.loader.set(true);

    this.operationService.create(payload).subscribe({
      next: () => {
        this.loader.set(false);
        this.success.set(true);
        this.pieceJointe.set(null);
        this.pieceJointeNom.set(null);
        this.initForm(); // recrée le form + souscription + reset totaux
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ??
            "Une erreur est survenue lors de l'enregistrement",
        );
        this.loader.set(false);
        setTimeout(() => this.errorMessage.set(null), 4000);
      },
    });
  }

  annuler(): void {
    if (
      confirm(
        'Voulez-vous vraiment annuler ? Les modifications seront perdues.',
      )
    ) {
      this.router.navigate(['/caisse/journal']);
    }
  }

  get exerciceSelectionne(): string {
    const rfk = this.journalForm.get('exercice_comptable_rfk')?.value;
    if (!rfk) return 'Sélectionnez un exercice';
    return (
      this.exercices().find((e) => e.rfk === rfk)?.libelle ?? 'Exercice inconnu'
    );
  }
}
