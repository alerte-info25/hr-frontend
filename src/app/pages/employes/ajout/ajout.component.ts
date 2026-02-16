import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../material.module';
import { Router, RouterLink } from '@angular/router';
import { EmployesService } from '../../../services/employes.service';
import { ServicesService } from '../../../services/services.service';
import { FonctionsService } from '../../../services/fonctions.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../../loading/loading.component';
import { PAYS } from '../../../../data/pays';
import { NATIONALITES } from '../../../../data/nationnalite';
export interface Employee {
  id?: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance: string;
  emailPersonnel: string;
  telephone: string;
  nationalite: string;
  paysResidence: string;
  adresse: string;
  numeroSocial:string;
  emailProfessionnel:string;
  typePiece: string;
  numeroPiece: string;
  photo?: File | null;
}
@Component({
  selector: 'app-ajout',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    RouterLink,
    LoadingComponent
  ],
  templateUrl: './ajout.component.html',
  styleUrl: './ajout.component.scss'
})
export class AjoutComponent implements OnInit{
  currentStep = 1;
  totalSteps = 2;
  isLoading = true;
  personalInfoForm!: FormGroup;
  professionalInfoForm!: FormGroup;
  fonctions:any[]=[];
  services:any[]=[];
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;

  nationalites = NATIONALITES
  pays = PAYS
  typesPiece = [
    'Carte d\'identité',
    'Passeport',
    'Permis de conduire'
  ];

  constructor(
    private fb: FormBuilder,
    private employeSvr: EmployesService,
    private router: Router,
    private svrService: ServicesService,
    private fonctionSvr: FonctionsService,
    private snackBar: MatSnackBar

  ) {}

  ngOnInit() {
    this.initializeForms();
    this.getFonctionListe();
    this.getServiceListe()
  }

  initializeForms() {
    this.personalInfoForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      genre: ['', Validators.required],
      dateNaissance: ['', Validators.required],
      lieuNaissance: ['', Validators.required],
      emailPersonnel: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\+?[0-9\s\-\(\)]{8,15}$/)]],
      nationalite: ['', Validators.required],
      paysResidence: ['', Validators.required],
      adresse: ['', Validators.required]
    });

    this.professionalInfoForm = this.fb.group({
      emailProfessionnel:[''],
      numeroSocial: [''],
      typePiece: ['', Validators.required],
      id_service: [''],
      id_fonction: [''],
      numeroPiece: ['', [Validators.required, Validators.minLength(5)]],
      photo: [null]
    });
  }
  getFonctionListe(){
    this.fonctionSvr.getList().subscribe({
      next: (data) => {
        this.fonctions = data
        this.isLoading = false
      },
      error: (err) => {
        console.error('Erreur de chargement des fonction', err);
        this.isLoading = false;
      }
    })
  }
  getServiceListe(){
    this.svrService.getList().subscribe({
      next: (data) => {
        this.services = data
        this.isLoading = false
      },
      error: (err) => {
        console.error('Erreur de chargement des services', err);
        this.isLoading = false;
      }
    })
  }
  nextStep() {
    if (this.currentStep === 1 && this.personalInfoForm.valid) {
      this.currentStep++;
    } else if (this.currentStep === 1) {
      this.markFormGroupTouched(this.personalInfoForm);
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Vérifier le type de fichier
      if (file.type.startsWith('image/')) {
        this.selectedPhoto = file;

        // Créer un aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
          this.photoPreview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Veuillez sélectionner un fichier image valide.');
        target.value = '';
      }
    }
  }

  removePhoto() {
    this.selectedPhoto = null;
    this.photoPreview = null;
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onSubmit() {
    this.isLoading = true;
    if (this.professionalInfoForm.valid && this.personalInfoForm.valid) {
      if (this.selectedPhoto) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Photo = reader.result as string;
          const employeeData: Employee = {
            ...this.personalInfoForm.value,
            ...this.professionalInfoForm.value,
            photo: base64Photo
          };

          this.employeSvr.addEmployes(employeeData).subscribe({
            next: () => {
              this.isLoading = false;
              this.snackBar.open('Employé ajouté avec succès ✅', 'Fermer', {
                duration: 3000,
                panelClass: ['toast-success']
              });
              this.router.navigate(['/employes']);
            },
            error: (err) => {
              this.isLoading = false;
              this.snackBar.open(err.message, 'Fermer', {
                duration: 4000,
                panelClass: ['toast-error']
              });
              // console.error(err);
            }
          });
        };
        reader.readAsDataURL(this.selectedPhoto);
      } else {
        const employeeData: Employee = {
          ...this.personalInfoForm.value,
          ...this.professionalInfoForm.value,
          photo: null
        };
        this.employeSvr.addEmployes(employeeData).subscribe({
          next: () => {
            this.isLoading = false;
            this.snackBar.open('Employé ajouté avec succès ✅', 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.router.navigate(['/employes']);
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open('Échec de l’ajout de l’employé ❌', 'Fermer', {
              duration: 4000,
              panelClass: ['toast-error']
            });
            // console.error(err);
          }
        });
      }
    } else {
      this.isLoading = true;
      this.markFormGroupTouched(this.professionalInfoForm);
      this.snackBar.open('Formulaire invalide ⚠️', 'Fermer', {
        duration: 3000,
        panelClass: ['toast-warning']
      });
    }
  }


  resetWizard() {
    this.currentStep = 1;
    this.personalInfoForm.reset();
    this.professionalInfoForm.reset();
    this.selectedPhoto = null;
    this.photoPreview = null;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['email']) return 'Email invalide';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['pattern']) return 'Format invalide';
    }
    return '';
  }

  getProgress(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}
