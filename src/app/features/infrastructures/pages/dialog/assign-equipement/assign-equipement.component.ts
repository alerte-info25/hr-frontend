import {
  Component,
  Inject,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MaterialModule } from '../../../../../../../material.module';
import { InfrasEmployesService } from '../../../services/infras-employes.service';
import { InfrasAffectationService } from '../../../services/infras-affectation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule }from '@angular/material/progress-spinner';
import { AuthService } from '../../../../../services/auth.service';
import { BureauxService } from '../../../services/bureaux.service';
import { ZonesService } from '../../../services/zones.service';
@Component({
  selector: 'app-assign-equipement',
  imports: [MaterialModule,CommonModule,ReactiveFormsModule,MatProgressSpinnerModule],
  templateUrl: './assign-equipement.component.html',
  styleUrl: './assign-equipement.component.scss'
})
export class AssignEquipementComponent {
  private fb = inject(FormBuilder);
  private employeService = inject(InfrasEmployesService);
  private bureauxService = inject(BureauxService);
  private zoneService = inject(ZonesService);
  private affectationService = inject(InfrasAffectationService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  dialogRef = inject(MatDialogRef<AssignEquipementComponent>);

  loading = signal(true);
  employees = signal<any[]>([]);
  bureaux = signal<any[]>([]);
  zones = signal<any[]>([]);
  filteredZones = signal<any[]>([]);
  form = this.fb.group({
    user_rh_slug: ['',Validators.required],
    zone_slug: ['',Validators.required],
    bureau_slug: ['',Validators.required],
    // statut: ['', Validators.required],
    motif: ['', Validators.required],
    affecte_par: [this.authService.getCurrentUser()?.employe?.slug || ''],
    notes: ['']
  });

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadBureaux();
    this.form
    .get('bureau_slug')
    ?.valueChanges
    .subscribe((bureauSlug) => {

      this.onBureauChange(bureauSlug);

    });
  }

  loadEmployees(): void {
    this.employeService.getAll().subscribe({
      next: (res: any) => {
        this.employees.set(res);
        this.loading.set(false  );
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des employés', 'Fermer', { duration: 5000 });
      },
    });
  }

  loadBureaux(){
    this.bureauxService.getAll().subscribe({
      next: (res: any) => {
        this.bureaux.set(res);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des bureaux', 'Fermer', { duration: 5000 });
      }
    });
  }

  onBureauChange(bureauSlug: any): void {

    const bureau = this.bureaux()
      .find(b => b.rh_slug  === bureauSlug);

    if (!bureau) {

      this.filteredZones.set([]);

      this.form.patchValue({
        zone_slug: null
      });

      return;
    }

    this.filteredZones.set(
      bureau.zones || []
    );

    this.form.patchValue({
      zone_slug: null
    });

  }

  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const payload = {
      equipement_slug: this.data.slug,
      ...this.form.value
    };

    this.affectationService.create(payload).subscribe({
      next: (res) => {

        this.loading.set(false);

        this.dialogRef.close({
          success: true,
          data: res
        });
      },

      error: () => {
        this.loading.set(false);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }

}
