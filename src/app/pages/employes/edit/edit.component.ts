import { Component, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MaterialModule } from '../../../../../material.module';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FonctionsService } from '../../../services/fonctions.service';
import { ServicesService } from '../../../services/services.service';
import { EmployesService } from '../../../services/employes.service';
import { NATIONALITES } from '../../../../data/nationnalite';
import { PAYS } from '../../../../data/pays';
export interface Employee {
  id?: number;
  nom: string;
  prenom: string;
  genre: string;
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
  service: string;
  fonction: string;
  numeroPiece: string;
  photo?: File | null;
}
@Component({
  selector: 'app-edit',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    RouterLink
  ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss'
})
export class EditComponent {
@Input() employeeData?: Employee;
  selectedFile: File | null = null;
  currentStep = 1;
  totalSteps = 2;
  isLoading = false;
  theEmploye:any;
  personalInfoForm!: FormGroup;
  professionalInfoForm!: FormGroup;
  fonctions:any[]=[];
  services:any[]=[];
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;
  currentPhotoUrl: string | null = null;
  photoChanged = false;

  nationalites = NATIONALITES
  pays = PAYS
  typesPiece = [
    'Carte d\'identité',
    'Passeport',
    'Permis de conduire'
  ];


  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeSvr: EmployesService,
    private svrService: ServicesService,
    private fonctionSvr: FonctionsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.initializeForms();
    this.getServiceListe();
    this.getFonctionListe();
    this.loadEmployeeData();
  }
  goBack() {
    window.history.back();
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
      typePiece: ['', Validators.required],
      numeroPiece: ['', [Validators.required, Validators.minLength(5)]],
      numeroSocial: [''],
      id_service: [''],
      id_fonction: [''],
      emailProfessionnel: [''],
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
  loadEmployeeData() {
    const slug = this.route.snapshot.paramMap.get('id');
    if (!slug) return;

    this.isLoading = true;

    this.employeSvr.getEmployesBySlug(slug).subscribe({
      next: (employee) => {
        this.theEmploye = employee;

        // Formulaire personnel
        this.personalInfoForm.patchValue({
          nom: employee.nom,
          prenom: employee.prenom,
          genre: employee.genre,
          dateNaissance: employee.dateNaissance,
          lieuNaissance: employee.lieuNaissance,
          emailPersonnel: employee.emailPersonnel,
          telephone: employee.telephone,
          nationalite: employee.nationnalite,
          paysResidence: employee.paysResidence,
          adresse: employee.adresse
        });

        // Formulaire pro
        this.professionalInfoForm.patchValue({
          typePiece: employee.typePiece,
          numeroPiece: employee.numeroPiece,
          numeroSocial: employee.numeroSocial,
          emailProfessionnel: employee.emailProfessionnel,
          id_service: employee.id_service,
          id_fonction: employee.id_fonction,
          photo: null
        });

        // Photo
        if (employee.photo_url) {
          this.currentPhotoUrl = employee.photo_url;
          this.photoPreview = employee.photo_url;
        }

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open(
          "Erreur lors de la récupération de l'employé",
          'Fermer',
          { duration: 3000, panelClass: ['toast-warning'] }
        );
      }
    });
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

  onFileSelected(event: any): void {
    const file = event.target.files[0] as File;
    if (file) {
      const reader = new FileReader();

      // Écouter l'événement de lecture
      reader.onload = (event: any) => {
        this.selectedFile  = event.target.result;

      };

      // Lancer la lecture du fichier
      reader.readAsDataURL(file);
    }else{
      this.selectedFile = null
    }

  }

  removePhoto() {
    this.selectedPhoto = null;
    this.photoPreview = null;
    this.currentPhotoUrl = null;
    this.photoChanged = true;
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  restoreOriginalPhoto() {
    if (this.currentPhotoUrl) {
      this.photoPreview = this.currentPhotoUrl;
      this.selectedPhoto = null;
      this.photoChanged = false;
      const fileInput = document.getElementById('photo') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  onUpdate() {
    if (this.professionalInfoForm.valid && this.personalInfoForm.valid) {
      this.isLoading = true;

      const updatedEmployee: Employee = {
        id: this.employeeData?.id || this.theEmploye.id,
        ...this.personalInfoForm.value,
        ...this.professionalInfoForm.value,

      };
      if (this.selectedFile) {
      updatedEmployee.photo = this.selectedFile;
    }

      // Simulation d'une mise à jour
      this.employeSvr.updateEmployes(this.theEmploye.slug,updatedEmployee).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Employé modifié avec succès ✅', 'Fermer', {
            duration: 4000,
            panelClass: ['toast-success']
          });
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open('Échec de la modification de l’employé ❌', 'Fermer', {
            duration: 4000,
            panelClass: ['toast-error']
          });
        }
      });
    } else {
      this.markFormGroupTouched(this.professionalInfoForm);
      this.markFormGroupTouched(this.personalInfoForm);
       this.snackBar.open('Échec de la modification de l’employé ❌', 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
    }
  }

  onCancel() {
    if (this.hasChanges()) {
      if (confirm('Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir annuler ?')) {
        // this.router.navigate(['/employees']);
        this.resetToOriginal();
      }
    } else {
      // this.router.navigate(['/employees']);
      this.resetToOriginal();
    }
  }

  resetToOriginal() {
    this.loadEmployeeData();
    this.currentStep = 1;
  }

  hasChanges(): boolean {
    const currentPersonalData = this.personalInfoForm.value;
    const currentProfessionalData = this.professionalInfoForm.value;
    const originalEmployee = this.employeeData || this.theEmploye;

    // Vérifier les changements dans les informations personnelles
    const personalChanged = Object.keys(currentPersonalData).some(key =>
      currentPersonalData[key] !== originalEmployee[key as keyof Employee]
    );

    // Vérifier les changements dans les informations professionnelles
    const professionalChanged = Object.keys(currentProfessionalData).some(key =>
      key !== 'photo' && currentProfessionalData[key] !== originalEmployee[key as keyof Employee]
    );

    return personalChanged || professionalChanged || this.photoChanged;
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

  getInitials(): string {
    const nom = this.personalInfoForm.get('nom')?.value || '';
    const prenom = this.personalInfoForm.get('prenom')?.value || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }
}
