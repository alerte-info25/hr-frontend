import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../../services/auth.service';
import { BureauxService } from '../../../services/bureaux.service';
import { ZonesService } from '../../../services/zones.service';
import { InfrasMouvementService } from '../../../services/infras-mouvement.service';

@Component({
  selector: 'app-mvt-equipement',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './mvt-equipement.component.html',
  styleUrl: './mvt-equipement.component.scss',
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class MvtEquipementComponent implements OnInit {

  mouvementForm: FormGroup;
  isLoading = false;

  // Types de mouvement
  mouvementTypes = [
    { value: 'sortie_terrain', label: 'Sortie sur terrain', icon: 'logout', color: '#ef4444' },
    { value: 'retour_terrain', label: 'Retour de terrain', icon: 'login', color: '#10b981' },
    // { value: 'mise_en_maintenance', label: 'Mise en maintenance', icon: 'build', color: '#f59e0b' },
    { value: 'reforme', label: 'Hors service', icon: 'delete_forever', color: '#6b7280' }
  ];

  // Liste des états possibles
  etatsPossibles = [
    { value: 'neuf', label: 'Neuf', color: '#10b981' },
    { value: 'bon_etat', label: 'Bon état', color: '#8b5cf6' },
    { value: 'en_panne', label: 'En panne', color: '#f59e0b' },
    { value: 'reforme', label: 'Hors service', color: '#6b7280' }
  ];

  // Listes pour les selects (maintenance et reforme)
  bureaux: any[] = [];
  zones: any[] = [];
  zonesFiltrees: any[] = [];
  zonesDestFiltrees: any[] = []; // Pour les zones de destination

  // État des champs
  showSourceFields = signal(false); // Pour maintenance et reforme
  showDestinationFields = signal(false); // Non utilisé mais gardé pour cohérence

  // Informations de l'équipement
  equipementInfo = {
    designation: '',
    bureau_nom: '',
    bureau_slug: '',
    zone_nom: '',
    zone_slug: '',
    etat: ''
  };

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MvtEquipementComponent>,
    private snackBar: MatSnackBar,
    private authSvr: AuthService,
    private bureauSvr: BureauxService,
    private mvtSvr: InfrasMouvementService,
    private zoneSvr: ZonesService,
    @Inject(MAT_DIALOG_DATA) public data: { equipement: any }
  ) {
    this.mouvementForm = this.initForm();
  }

  ngOnInit(): void {
    // Récupérer les infos de l'équipement
    this.equipementInfo = {
      designation: this.data.equipement.designation || 'Équipement',
      bureau_nom: this.data.equipement.bureau?.acronyme || 'Non défini',
      bureau_slug: this.data.equipement.bureau?.rh_slug || '',
      zone_nom: this.data.equipement.zone?.nom || 'Non défini',
      zone_slug: this.data.equipement.zone?.slug || '',
      etat: this.data.equipement.etat || 'bon'
    };

    // Pré-remplir les champs source avec les infos de l'équipement
    this.mouvementForm.patchValue({
      bureau_source_slug: this.equipementInfo.bureau_slug,
      zone_source_slug: this.equipementInfo.zone_slug,
      etat_avant: this.equipementInfo.etat
    });

    // Charger les bureaux pour maintenance et reforme
    this.loadBureaux();

    // Écouter les changements de type
    this.mouvementForm.get('type')?.valueChanges.subscribe(type => {
      this.updateFormVisibility(type);
    });

    // Écouter les changements de bureau source pour filtrer les zones
    this.mouvementForm.get('bureau_source_slug')?.valueChanges.subscribe(bureauSlug => {
      if (bureauSlug) {
        this.loadZonesByBureau(bureauSlug);
      } else {
        this.zonesFiltrees = [];
      }
    });

    // Écouter les changements de bureau destination pour filtrer les zones de destination
    this.mouvementForm.get('bureau_dest_slug')?.valueChanges.subscribe(bureauSlug => {
      if (bureauSlug) {
        this.loadZonesForDestination(bureauSlug);
      } else {
        this.zonesDestFiltrees = [];
      }
    });
  }

  private initForm(): FormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      bureau_source_slug: [''],
      zone_source_slug: [''],
      motif: ['', [Validators.required, Validators.minLength(3)]],
      notes: [''],
      // Champs pour sortie
      destination_libre: [''],
      date_retour_prevue: [''],
      bureau_dest_slug: [''],
      zone_dest_slug: [''],
      // Champs pour retour
      etat_avant: [''],
      etat_apres: ['']
    });
  }

  private updateFormVisibility(type: string): void {
    // Reset des validators
    this.mouvementForm.get('bureau_source_slug')?.clearValidators();
    this.mouvementForm.get('zone_source_slug')?.clearValidators();
    this.mouvementForm.get('destination_libre')?.clearValidators();
    this.mouvementForm.get('date_retour_prevue')?.clearValidators();
    this.mouvementForm.get('etat_apres')?.clearValidators();
    this.mouvementForm.get('bureau_dest_slug')?.clearValidators();
    this.mouvementForm.get('zone_dest_slug')?.clearValidators();

    switch (type) {
      case 'sortie_terrain':
        this.showSourceFields.set(false);
        this.mouvementForm.get('destination_libre')?.setValidators([Validators.required]);
        this.mouvementForm.get('date_retour_prevue')?.setValidators([Validators.required]);
        break;

      case 'retour_terrain':
        this.showSourceFields.set(false);
        this.mouvementForm.get('etat_apres')?.setValidators([Validators.required]);
        this.mouvementForm.get('bureau_dest_slug')?.setValidators([Validators.required]);
        this.mouvementForm.get('zone_dest_slug')?.setValidators([Validators.required]);
        break;

      case 'reforme':
        this.showSourceFields.set(true);
        // Champs source requis
        this.mouvementForm.get('bureau_source_slug')?.setValidators([Validators.required]);
        this.mouvementForm.get('zone_source_slug')?.setValidators([Validators.required]);
        // Champs destination requis
        this.mouvementForm.get('bureau_dest_slug')?.setValidators([Validators.required]);
        this.mouvementForm.get('zone_dest_slug')?.setValidators([Validators.required]);
        break;

      default:
        this.showSourceFields.set(false);
        break;
    }

    // Mettre à jour les validators
    this.mouvementForm.get('bureau_source_slug')?.updateValueAndValidity();
    this.mouvementForm.get('zone_source_slug')?.updateValueAndValidity();
    this.mouvementForm.get('destination_libre')?.updateValueAndValidity();
    this.mouvementForm.get('date_retour_prevue')?.updateValueAndValidity();
    this.mouvementForm.get('etat_apres')?.updateValueAndValidity();
    this.mouvementForm.get('bureau_dest_slug')?.updateValueAndValidity();
    this.mouvementForm.get('zone_dest_slug')?.updateValueAndValidity();
  }

  loadBureaux(): void {
    this.bureauSvr.getAll().subscribe({
      next: (data) => this.bureaux = data,
      error: () => this.snackBar.open('Erreur chargement bureaux', 'Fermer', { duration: 3000 })
    });
  }

  loadZonesByBureau(bureauSlug: string): void {
    this.zoneSvr.getZonesByBureau(bureauSlug).subscribe({
      next: (data) => {
        this.zonesFiltrees = data;
      },
      error: () => this.snackBar.open('Erreur chargement zones', 'Fermer', { duration: 3000 })
    });
  }

  loadZonesForDestination(bureauSlug: string): void {
    this.zoneSvr.getZonesByBureau(bureauSlug).subscribe({
      next: (data) => {
        this.zonesDestFiltrees = data;
      },
      error: () => this.snackBar.open('Erreur chargement zones de destination', 'Fermer', { duration: 3000 })
    });
  }

  getSelectedTypeIcon(): string {
    const type = this.mouvementForm.get('type')?.value;
    const found = this.mouvementTypes.find(t => t.value === type);
    return found?.icon || 'swap_horiz';
  }

  getSelectedTypeColor(): string {
    const type = this.mouvementForm.get('type')?.value;
    const found = this.mouvementTypes.find(t => t.value === type);
    return found?.color || '#6b7280';
  }

  getEtatLabel(etatValue: string): string {
    const etat = this.etatsPossibles.find(e => e.value === etatValue);
    return etat?.label || etatValue;
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.mouvementForm.invalid) {
      this.mouvementForm.markAllAsTouched();
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    const formValue = this.mouvementForm.getRawValue();

    const payload: any = {
      type: formValue.type,
      motif: formValue.motif,
      notes: formValue.notes || '',
      equipement_slug: this.data.equipement.slug,
      user_rh_slug: this.authSvr.getCurrentUser()?.employe.slug,
      valider: 0
    };

    // Ajouter les champs selon le type
    if (formValue.type === 'sortie_terrain') {
      payload.bureau_source_slug = this.equipementInfo.bureau_slug;
      payload.zone_source_slug = this.equipementInfo.zone_slug;
      payload.etat_avant = formValue.etat_avant;
      payload.destination_libre = formValue.destination_libre;
      payload.date_retour_prevue = formValue.date_retour_prevue;

    } else if (formValue.type === 'retour_terrain') {
      payload.bureau_source_slug = this.equipementInfo.bureau_slug;
      payload.zone_source_slug = this.equipementInfo.zone_slug;
      payload.etat_avant = formValue.etat_avant;
      payload.etat_apres = formValue.etat_apres;
      payload.bureau_dest_slug = formValue.bureau_dest_slug;
      payload.zone_dest_slug = formValue.zone_dest_slug;

    } else if (formValue.type === 'reforme') {
      payload.bureau_source_slug = formValue.bureau_source_slug;
      payload.zone_source_slug = formValue.zone_source_slug;
      payload.etat_avant = formValue.etat_avant;
      payload.bureau_dest_slug = formValue.bureau_dest_slug;
      payload.zone_dest_slug = formValue.zone_dest_slug;
    }

    this.mvtSvr.create(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Mouvement créé avec succès ✅', 'Fermer', { duration: 3000 });
        this.dialogRef.close({ success: true, data: payload });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Erreur lors de la création du mouvement','Fermer',{
          duration: 4000
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
