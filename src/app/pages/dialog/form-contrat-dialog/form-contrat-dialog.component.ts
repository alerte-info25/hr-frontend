import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ContratService } from '../../../services/contrat.service';
import { EmployesService } from '../../../services/employes.service';
import { TypeContratService } from '../../../services/type-contrat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../../material.module';
import { CommonModule, DatePipe } from '@angular/common';
import { addMonths, parseISO  } from 'date-fns';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
@Component({
  selector: 'app-form-contrat-dialog',
  imports: [
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './form-contrat-dialog.component.html',
  styleUrl: './form-contrat-dialog.component.scss'
})
export class FormContratDialogComponent {
  form!: FormGroup;
  employes: any[] = [];
  typesContrat: any[] = [];
  selectedType: any = null;
  dateFin?: Date;
  isLoading: boolean = true;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<FormContratDialogComponent>,
    private contratService: ContratService,
    private employeService: EmployesService,
    private typeContratService: TypeContratService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    // Initialisation du formulaire avec valeurs par défaut
    this.form = this.fb.group({
      numero: ['', Validators.required],
      id_employe: ['', Validators.required],
      id_type: ['', Validators.required],
      debut: ['', Validators.required],
      salaire: ['', [Validators.required, Validators.min(0)]],
      nbheure: ['', [Validators.required, Validators.min(1)]],
      statut: ['1'] // valeur par défaut
    });

    this.loadEmployes();
    this.loadTypes();

    // Si on a des données => modification
    if (this.data) {
      const debutDate = this.data.debut ? new Date(this.data.debut) : null;

      this.form.patchValue({
        numero: this.data.numero,
        id_employe: this.data.id_employe,
        id_type: this.data.id_type,
        debut: debutDate,
        salaire: this.data.salaire,
        nbheure: this.data.nbheure,
        statut: this.data.statut ? this.data.statut.toString() : '1'
      });

      this.selectedType = this.typesContrat.find(t => t.slug === this.data.id_type);
      this.updateFin();
    }
  }

  loadEmployes() {
    this.employeService.getList().subscribe({
      next: (data) => {
        this.employes = data;
        this.snackBar.open('Liste récupéré avec succès','Fermer',{
          duration: 3000
        })
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des employés', err);
        this.snackBar.open('Erreur de chargement des employés','Fermer',{
          duration: 3000
        })
        this.isLoading = false;
      }
    })
  }

  loadTypes() {
    this.typeContratService.getList().subscribe({
      next: (data) => {
        this.typesContrat = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur de chargement des types de contrats', err);
        this.snackBar.open(err.message || 'Erreur de chargement des types de contrats','Fermer',{
          duration: 4000,
          panelClass: ['toast-error']
        })
        this.isLoading = false;
      }
    })
  }

  onTypeChange(slug: string) {
    this.selectedType = this.typesContrat.find(t => t.slug === slug);
    this.updateFin();
  }

  updateFin() {
    const debutValue: Date = this.form.get('debut')?.value;
    const typeSlug = this.form.get('id_type')?.value;

    if (!debutValue || !typeSlug) {
      this.dateFin = undefined;
      return;
    }

    const typeContrat = this.typesContrat.find(t => t.slug === typeSlug);

    // 🟢 CAS CDI → pas de date de fin
    if (!typeContrat?.duree || Number(typeContrat.duree) === 0) {
      this.dateFin = undefined;
      return;
    }

    // 🟢 Autres contrats
    const duree = Number(typeContrat.duree);
    this.dateFin = addMonths(debutValue, duree);
  }



  // save() {
  //   if (this.form.invalid) return;

  //   const debut: Date = this.form.get('debut')?.value;

  //   const payload = {
  //     ...this.form.value,
  //     debut: debut ? debut.toISOString().split('T')[0] : null,
  //     fin: this.dateFin?.toISOString().split('T')[0],
  //     // statut: ''
  //   };

  //   const request$ = this.data?.id
  //     ? this.contratService.updateContrat(this.data.slug, payload) // Méthode update
  //     : this.contratService.addContrat(payload);               // Méthode add

  //   request$.subscribe({
  //     next: () => {
  //       this.snackBar.open(
  //         this.data?.id ? 'Contrat modifié avec succès ✅' : 'Contrat ajouté avec succès ✅',
  //         'Fermer',
  //         { duration: 3000, panelClass: ['toast-success'] }
  //       );
  //       this.dialogRef.close(true);
  //     },
  //     error: (err) => {
  //       console.error('Erreur lors de la sauvegarde du contrat', err);
  //       this.snackBar.open(
  //         err.message || 'Echec lors de la sauvegarde du contrat ❌',
  //         'Fermer',
  //         { duration: 3000, panelClass: ['toast-error'] }
  //       );
  //     }
  //   });
  // }

  save() {
    if (this.form.invalid) return;

    const debut: Date = this.form.get('debut')?.value;

    const payload = {
      ...this.form.value,
      debut: debut ? debut.toISOString().split('T')[0] : null,
      fin: this.dateFin
        ? this.dateFin.toISOString().split('T')[0]
        : null // 🟢 CDI → fin = null
    };

    const request$ = this.data?.id
      ? this.contratService.updateContrat(this.data.slug, payload)
      : this.contratService.addContrat(payload);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          this.data?.id ? 'Contrat modifié avec succès ✅' : 'Contrat ajouté avec succès ✅',
          'Fermer',
          { duration: 3000, panelClass: ['toast-success'] }
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(
          err.error.message || 'Echec lors de la sauvegarde ❌',
          'Fermer',
          { duration: 3000, panelClass: ['toast-error'] }
        );
      }
    });
  }


}

