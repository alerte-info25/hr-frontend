import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContratService } from '../../../services/contrat.service';
import { EmployesService } from '../../../services/employes.service';
import { TypeContratService } from '../../../services/type-contrat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../../material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { addMonths } from 'date-fns';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { fr } from 'date-fns/locale';

@Component({
  selector: 'app-form-contrat-dialog',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    CommonModule,
    MatDatepickerModule,
  ],
  providers: [
    provideDateFnsAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: fr },
  ],
  templateUrl: './form-contrat-dialog.component.html',
  styleUrl: './form-contrat-dialog.component.scss',
})
export class FormContratDialogComponent implements OnInit {
  form!: FormGroup;
  employes: any[] = [];
  typesContrat: any[] = [];
  selectedType: any = null;
  dateFin?: Date;
  dateFinAuto?: Date;
  modeFinManuel = false;
  isCDI = false;
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FormContratDialogComponent>,
    private contratService: ContratService,
    private employeService: EmployesService,
    private typeContratService: TypeContratService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      numero: ['', Validators.required],
      id_employe: ['', Validators.required],
      id_type: ['', Validators.required],
      debut: ['', Validators.required],
      fin: [null],
      salaire: ['', [Validators.required, Validators.min(0)]],
      nbheure: ['', [Validators.required, Validators.min(1)]],
      statut: ['1'],
    });

    this.loadEmployes();
    this.loadTypes();

    if (this.data) {
      const debutDate = this.data.debut
        ? this.parseDateLocale(this.data.debut)
        : null;

      const finDate = this.data.fin
        ? this.parseDateLocale(this.data.fin)
        : null;

      this.form.patchValue({
        numero: this.data.numero,
        id_employe: this.data.id_employe,
        id_type: this.data.id_type,
        debut: debutDate,
        fin: finDate,
        salaire: this.data.salaire,
        nbheure: this.data.nbheure,
        statut: this.data.statut ? this.data.statut.toString() : '1',
      });
    }
  }

  /** Parse une date string (YYYY-MM-DD ou ISO) en Date locale sans décalage UTC */
  private parseDateLocale(dateStr: string): Date {
    const str = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  loadEmployes() {
    this.employeService.getList().subscribe({
      next: (data) => {
        this.employes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement employés', err);
        this.snackBar.open('Erreur de chargement des employés', 'Fermer', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  loadTypes() {
    this.typeContratService.getList().subscribe({
      next: (data) => {
        this.typesContrat = data;
        if (this.data?.id_type) {
          this.onTypeChange(this.data.id_type);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement types', err);
        this.snackBar.open(
          err.message || 'Erreur de chargement des types',
          'Fermer',
          { duration: 4000, panelClass: ['toast-error'] },
        );
        this.isLoading = false;
      },
    });
  }

  onTypeChange(slug: string) {
    this.selectedType = this.typesContrat.find((t) => t.slug === slug);
    const duree = Number(this.selectedType?.duree ?? 0);
    this.isCDI = !duree;
    this.modeFinManuel = false;
    this.computeFinAuto();
  }

  onDebutChange() {
    this.computeFinAuto();
  }

  computeFinAuto() {
    const debutRaw = this.form.get('debut')?.value;
    const typeSlug = this.form.get('id_type')?.value;

    if (!debutRaw || !typeSlug) {
      this.dateFinAuto = undefined;
      this.dateFin = undefined;
      return;
    }

    const typeContrat = this.typesContrat.find((t) => t.slug === typeSlug);
    const duree = Number(typeContrat?.duree ?? 0);

    if (!duree) {
      this.isCDI = true;
      this.dateFinAuto = undefined;
      this.dateFin = undefined;
      return;
    }

    this.isCDI = false;

    // Avec date-fns adapter, le datepicker retourne toujours un objet Date
    // On normalise quand même pour éviter tout décalage résiduel
    const debut: Date =
      debutRaw instanceof Date
        ? new Date(
            debutRaw.getFullYear(),
            debutRaw.getMonth(),
            debutRaw.getDate(),
          )
        : this.parseDateLocale(String(debutRaw));

    this.dateFinAuto = addMonths(debut, duree);
    this.dateFin = this.dateFinAuto;
  }

  toggleModeManuel() {
    this.modeFinManuel = !this.modeFinManuel;
    if (!this.modeFinManuel) {
      this.form.get('fin')?.setValue(null);
      this.computeFinAuto();
    }
  }

  onFinManuelChange() {
    const finRaw = this.form.get('fin')?.value;
    if (!finRaw) {
      this.dateFin = undefined;
      return;
    }
    this.dateFin =
      finRaw instanceof Date
        ? new Date(finRaw.getFullYear(), finRaw.getMonth(), finRaw.getDate())
        : this.parseDateLocale(String(finRaw));
  }

  get finAffichee(): string {
    if (this.isCDI) return 'Indéterminée (CDI)';
    if (!this.dateFin) return '—';
    return this.dateFin.toLocaleDateString('fr-FR');
  }

  private dateToISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  save() {
    if (this.form.invalid) return;

    const debutRaw: Date = this.form.get('debut')?.value;
    const finDate = this.isCDI ? null : this.dateFin;

    const debut =
      debutRaw instanceof Date
        ? new Date(
            debutRaw.getFullYear(),
            debutRaw.getMonth(),
            debutRaw.getDate(),
          )
        : this.parseDateLocale(String(debutRaw));

    const payload = {
      ...this.form.value,
      debut: this.dateToISO(debut),
      fin: finDate ? this.dateToISO(finDate) : null,
    };

    // On retire le champ fin du spread (déjà recalculé proprement ci-dessus)
    delete payload.fin;
    payload.fin = finDate ? this.dateToISO(finDate) : null;

    const request$ = this.data?.id
      ? this.contratService.updateContrat(this.data.slug, payload)
      : this.contratService.addContrat(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.data?.id
            ? 'Contrat modifié avec succès'
            : 'Contrat ajouté avec succès',
          'Fermer',
          { duration: 3000, panelClass: ['toast-success'] },
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Échec lors de la sauvegarde du contrat',
          'Fermer',
          { duration: 3000, panelClass: ['toast-error'] },
        );
      },
    });
  }
}
