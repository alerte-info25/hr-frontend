// dialog/assign-equipement.component.ts
import {
  Component,
  Inject,
  inject,
  signal,
  OnInit
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
export class AssignEquipementComponent implements OnInit {
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
    user_rh_slug: ['', Validators.required],
    zone_slug: ['', Validators.required],
    bureau_slug: ['', Validators.required],
    motif: ['', Validators.required],
    affecte_par: [this.authService.getCurrentUser()?.employe?.slug || ''],
    notes: ['']
  });

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}

  ngOnInit(): void {
    // Charger les données en parallèle
    Promise.all([
      this.loadEmployees(),
      this.loadBureaux()
    ]).then(() => {
      // Une fois les bureaux chargés, pré-sélectionner si l'équipement a déjà un bureau/zone
      this.preselectExistingLocation();
    });

    this.form
      .get('bureau_slug')
      ?.valueChanges
      .subscribe((bureauSlug) => {
        this.onBureauChange(bureauSlug);
      });
  }

  preselectExistingLocation(): void {
    // Vérifier si l'équipement a déjà un bureau
    const existingBureauSlug = this.data.bureau_slug || this.data.bureau?.rh_slug;
    const existingZoneSlug = this.data.zone_slug || this.data.zone?.slug;

    if (existingBureauSlug) {
      // Trouver le bureau correspondant
      const bureau = this.bureaux().find(b => b.rh_slug === existingBureauSlug);
      
      if (bureau) {
        // Pré-sélectionner le bureau
        this.form.patchValue({
          bureau_slug: existingBureauSlug
        });
        
        // Charger les zones de ce bureau
        this.filteredZones.set(bureau.zones || []);
        
        // Si une zone existe, la pré-sélectionner
        if (existingZoneSlug) {
          // Vérifier que la zone existe dans la liste
          const zoneExists = this.filteredZones().some(z => z.slug === existingZoneSlug);
          if (zoneExists) {
            this.form.patchValue({
              zone_slug: existingZoneSlug
            });
          }
        }
      }
    }
  }

  loadEmployees(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.employeService.getAll().subscribe({
        next: (res: any) => {
          this.employees.set(res);
          resolve();
        },
        error: (err: any) => {
          this.snackBar.open('Erreur lors du chargement des employés', 'Fermer', { duration: 5000 });
          reject(err);
        },
      });
    });
  }

  loadBureaux(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.bureauxService.getAll().subscribe({
        next: (res: any) => {
          this.bureaux.set(res);
          this.loading.set(false);
          resolve();
        },
        error: (err: any) => {
          this.loading.set(false);
          this.snackBar.open('Erreur lors du chargement des bureaux', 'Fermer', { duration: 5000 });
          reject(err);
        }
      });
    });
  }

  onBureauChange(bureauSlug: any): void {
    const bureau = this.bureaux()
      .find(b => b.rh_slug === bureauSlug);

    if (!bureau) {
      this.filteredZones.set([]);
      this.form.patchValue({
        zone_slug: null
      });
      return;
    }

    this.filteredZones.set(bureau.zones || []);
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
        
        // Fermer le dialog avec les données de succès
        this.dialogRef.close({
          success: true,
          data: res,
          message: 'Affectation réalisée avec succès !'
        });
      },
      error: (error) => {
        this.loading.set(false);
        
        // Fermer le dialog avec l'erreur
        this.dialogRef.close({
          success: false,
          error: error,
          message: error?.error?.message || 'Erreur lors de l\'affectation'
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}