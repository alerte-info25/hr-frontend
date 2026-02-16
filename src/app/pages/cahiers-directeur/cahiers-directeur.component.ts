import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule,ReactiveFormsModule,FormBuilder,FormGroup,Validators,FormArray} from '@angular/forms';
import { MaterialModule } from '../../../../material.module';
import { trigger, transition, query, style, stagger, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EmployesService } from '../../services/employes.service';
import { ServicesService } from '../../services/services.service';
import { CahierChargeService } from '../../services/cahier-charge.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { AuthService } from '../../services/auth.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-cahiers-directeur',
  standalone: true,
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule, ConfirmDeleteDialogComponent, LoadingComponent],
  templateUrl: './cahiers-directeur.component.html',
  styleUrl: './cahiers-directeur.component.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class CahiersDirecteurComponent implements OnInit {

  cahiers: any[] = [];
  filteredCahiers: any[] = [];

  services: any[] = [];
  employes: any[] = [];
  employesFiltres: any[] = [];

  isLoading = true;
  showForm = false;
  isEditing = false;

  selectedCahier: any | null = null;

  cahierForm!: FormGroup;

  searchTerm = '';
  selectedService = '';
  selectedYear = new Date().getFullYear();
  selectedTrimestre = '';

  years: number[] = [];
  trimestres = [1, 2, 3, 4];

  showConfirmModal = false;
  itemToDelete: any = null;

  user:any;
  serviceFields: Record<string, { label: string; key: string }[]> = {
    rédaction: [
      { label: 'Nombre d’articles', key: 'nombre_articles' },
      { label: 'Nombre de reportages', key: 'nombre_reportages' },
      { label: 'Nombre d’interviews', key: 'nombre_interviews' },
      { label: 'Nombre de vidéos', key: 'nombre_videos' }
    ],
    commercial: [
      { label: 'Nombre de clients', key: 'nombre_clients' },
      { label: 'Chiffre d’affaires (FCFA)', key: 'chiffre_affaire' }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private employeSrv: EmployesService,
    private serviceSrv: ServicesService,
    private cahierSrv: CahierChargeService,
    private authSvr: AuthService
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    this.generateYears();
    this.initForm();
    this.loadAllData();
    this.loadCahier()
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 6 }, (_, i) => currentYear - i);
  }

  initForm(): void {
    this.cahierForm = this.fb.group({
      employe_id: ['', Validators.required],
      service_id: ['', Validators.required],
      annee: [this.selectedYear, Validators.required],
      trimestre: ['', Validators.required],
      details: this.fb.array([])
    });

    this.cahierForm.get('service_id')?.valueChanges.subscribe(serviceId => {
      this.updateDetailsFields(serviceId);
      this.filterEmployesByService(serviceId);
    });
  }

  get detailsArray(): FormArray {
    return this.cahierForm.get('details') as FormArray;
  }

  // ================= DATA =================
  loadAllData(): void {
    this.isLoading = true;

    this.serviceSrv.getList().subscribe({
      next: data => this.services = data.filter(d=>d.nom == 'Commercial' || d.nom == 'Rédaction'),
      error: () => this.showError()
    });

    this.employeSrv.getList().subscribe({
      next: data => {
        this.employes = data;
        this.employesFiltres = data;
      },
      error: () => this.showError()
    });
  }

  loadCahier() {
    this.isLoading = true;

    this.cahierSrv.getList().subscribe({
      next: (data: any[]) => {
        // Map chaque cahier pour inclure employe, service et convertir les valeurs en nombre
        this.cahiers = data.map(c => ({
          ...c,
          employe: c.employe || {},   // sécurité si employe manquant
          service: c.service || {},   // sécurité si service manquant
          details: (c.details || []).map((d: { valeur: any; }) => ({
            ...d,
            valeur: Number(d.valeur)  // convertir string en number si besoin
          }))
        }));

        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showError();
      }
    });
  }


  // ================= FILTRES =================
  applyFilters(): void {
    this.filteredCahiers = this.cahiers.filter(c => {
      const search = this.searchTerm.toLowerCase();

      return (
        (!this.searchTerm ||
          c.employe?.nom.toLowerCase().includes(search) ||
          c.employe?.prenom.toLowerCase().includes(search)) &&
        (!this.selectedService || c.service_id === this.selectedService) &&
        c.annee === this.selectedYear &&
        (!this.selectedTrimestre || c.trimestre === +this.selectedTrimestre)
      );
    });
  }
  filterEmployesByService(serviceId: string, keepEmployee = false): void {

    if (!keepEmployee) {
      this.cahierForm.get('employe_id')?.reset();
    }

    if (!serviceId) {
      this.employesFiltres = this.employes;
      return;
    }

    this.employesFiltres = this.employes.filter(
      emp => emp.service_id === serviceId
    );
  }



  // ================= DETAILS =================
  updateDetailsFields(serviceId: string): void {
    const service = this.services.find(s => s.slug === serviceId);
    if (!service) return;

    const fields = this.serviceFields[service.nom.toLowerCase()] || [];
    this.detailsArray.clear();

    fields.forEach(f => {
      this.detailsArray.push(this.fb.group({
        cle: [f.key],
        valeur: [0, [Validators.required, Validators.min(0)]],
        label: [f.label]
      }));
    });
  }
  // ================= CRUD =================
  openForm(): void {
    this.showForm = true;
    this.isEditing = false;
    this.selectedCahier = null;
    this.cahierForm.reset({ annee: this.selectedYear });
    this.detailsArray.clear();
  }

  editCahier(c: any): void {
    this.showForm = true;
    this.isEditing = true;
    this.selectedCahier = c;

    // 1️⃣ filtrer les employés du service SANS reset
    this.filterEmployesByService(c.service_id, true);

    // 2️⃣ patcher le formulaire
    this.cahierForm.patchValue({
      service_id: c.service_id,
      employe_id: c.employe_id,
      annee: c.annee,
      trimestre: c.trimestre
    });

    // 3️⃣ générer les champs détails
    this.updateDetailsFields(c.service_id);

    // 4️⃣ remplir les valeurs des détails
    c.details?.forEach((d: any) => {
      const ctrl = this.detailsArray.controls.find(
        x => x.get('cle')?.value === d.cle
      );
      ctrl?.patchValue({ valeur: d.valeur });
    });
  }


  submitForm(): void {
    if (this.cahierForm.invalid) {
      this.showSnackbar('Formulaire invalide', 'error');
      return;
    }

    const payload = this.cahierForm.value;

    if (this.isEditing) {
      // Object.assign(this.selectedCahier!, payload);
      this.cahierSrv.updateCahier(this.selectedCahier.slug, payload).subscribe({
        next:()=>{
          this.isLoading = false
          this.showSnackbar('Cahier modifié', 'success');
          this.loadCahier()
        },
        error:(err)=>{
          this.isLoading = false
          this.showError()
        }
      })
    } else {
      const data = {
        ...payload,
        created_by: this.user?.employe.slug
      }
      this.isLoading = true;
      this.cahierSrv.addCahier(data).subscribe({
        next:()=>{
          this.isLoading = false;
          this.showSnackbar('Cahier créé', 'success');
          this.loadCahier();
        },
        error:(err)=>{
          this.isLoading = false
          this.showError()
        }
      })
    }

    this.applyFilters();
    this.closeForm();
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedCahier = null;
    this.cahierForm.reset();
  }

  // ================= UTILS =================
  getTrimestreLabel(t: number): string {
    return `T${t}`;
  }

  showSnackbar(msg: string, type: 'success' | 'error'): void {
    this.snackBar.open(msg, 'Fermer', {
      duration: 3000,
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }

  showError(): void {
    this.showSnackbar('Une erreur est survenue', 'error');
  }
  // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.cahierSrv.deleteCahier(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.loadCahier();
        this.snackBar.open('Cahier des charges supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeModal();
        this.isLoading = false;
        this.snackBar.open('Echec lors de la suppression du cahier des charges ❌', 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    });
  }
  // Ferme le modal sans supprimer
  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

  getFieldLabel(key: string): string {
    for (const serviceKey in this.serviceFields) {
      const field = this.serviceFields[serviceKey].find(f => f.key === key);
      if (field) return field.label;
    }
    return key;
  }

  formatValue(key: string, value: number): string {
    if (key === 'chiffre_affaires') {
      return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
    }
    return value.toString();
  }
}
