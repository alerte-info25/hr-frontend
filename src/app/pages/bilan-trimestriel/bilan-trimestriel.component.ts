import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { EditorModule } from 'primeng/editor';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { AuthService } from '../../services/auth.service';
import { MaterialModule } from '../../../../material.module';
import { BilanService } from '../../services/bilan.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-bilan-trimestriel',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EditorModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    CardModule,
    DividerModule,
    ToastModule,
    InputNumberModule,
    RadioButtonModule,
    MaterialModule
  ],
  templateUrl: './bilan-trimestriel.component.html',
  styleUrl: './bilan-trimestriel.component.scss'
})
export class BilanTrimestrielComponent {

  bilanForm!: FormGroup;
  employe = signal<any | null>(null);
  isSubmitting = signal(false);
  isLoading = signal(false);

  bilanId: string | null = null;
  isEditMode = signal(false);
  isloading = signal(false);
  trimestres = [
    { label: 'T1 (Jan-Mar)', value: 1 },
    { label: 'T2 (Avr-Juin)', value: 2 },
    { label: 'T3 (Juil-Sept)', value: 3 },
    { label: 'T4 (Oct-Déc)', value: 4 }
  ];

  statuts = [
    { label: 'En cours', value: 'en_cours' },
    { label: 'Terminé', value: 'termine' }
  ];


  annees: any[] = [];
  currentYear = new Date().getFullYear();
  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [
        { 'color': [
            '#000000', '#ffffff', '#e60000', '#ff9900', '#ffff00',
            '#008a00', '#0066cc', '#9933ff', '#c0c0c0', '#808080'
          ]
        },
        { 'background': [
            '#000000', '#ffffff', '#e60000', '#ff9900', '#ffff00',
            '#008a00', '#0066cc', '#9933ff', '#c0c0c0', '#808080'
          ]
        }
      ],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'font': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [
        { 'list': 'ordered' },
        { 'list': 'bullet' },
        { 'list': 'check' }
      ],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      [{ 'align': 'left' }],
      [{ 'align': 'center' }],
      [{ 'align': 'right' }],
      [{ 'align': 'justify' }],
      [{ 'direction': 'rtl' }],
      ['blockquote', 'code-block'],

      // Groupe 11: Médias
      ['link', 'image', 'video'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    },
    history: {
      delay: 1000,
      maxStack: 50,
      userOnly: true
    }
  };

  constructor(
    private fb: FormBuilder,
    private authSvr: AuthService,
    private bilanSvr: BilanService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Générer les 5 dernières années
    this.annees = [];
    for (let i = 0; i < 5; i++) {
      const year = this.currentYear - i;
      this.annees.push({
        label: year.toString(),
        value: year
      });
    }
  }

  getMoisDuTrimestre(trimestre: number): string[] {
    const trimestres = {
      1: ['Janvier', 'Février', 'Mars'],
      2: ['Avril', 'Mai', 'Juin'],
      3: ['Juillet', 'Août', 'Septembre'],
      4: ['Octobre', 'Novembre', 'Décembre']
    };
    return trimestres[trimestre as 1 | 2 | 3 | 4];
  }


  ngOnInit(): void {
    this.loadEmployeData();

    if (this.employe()) {
      this.initForm();

      this.bilanId = this.route.snapshot.paramMap.get('slug');
      if (this.bilanId) {
        this.isEditMode.set(true);
        this.loadBilan(this.bilanId);
      }
    }
  }

  // Remplir le formulaire avec les détails existants

  patchDetails(details: any) {
    const service = this.getServiceCode();

    if (!details) return;

    if (service === 'développement') {
      this.patchDeveloppeur(details);
    }

    if (service === 'rédaction') {
      this.patchJournaliste(details);
    }

    if (service === 'commercial') {
      this.patchCommercial(details);
    }

    if (service === 'comptabilité') {
      this.patchComptable(details);
    }

    if (this.isCoursier()) {
      this.patchCoursier(details);
    }
  }


  patchJournaliste(details: any) {
    this.clearFormArray(this.articles);

    this.bilanForm.patchValue({
      nombre_articles: details.nombre_articles,
      nombre_interviews: details.nombre_interviews,
      nombre_reportages: details.nombre_reportages,
      nombre_videos: details.nombre_videos
    });

    details.articles?.forEach((a: any) => {
      this.articles.push(
        this.fb.group({
          type: [a.type, Validators.required],
          lien: [a.lien, Validators.required]
        })
      );
    });
  }


  patchDeveloppeur(details: any) {
    this.clearFormArray(this.projets);

    details.projets?.forEach((p: any) => {
      this.projets.push(
        this.fb.group({
          nom: [p.nom, Validators.required],
          statut: [p.statut, Validators.required],
          taches: this.fb.array(
            p.taches.map((t: string) =>
              this.fb.control(t, Validators.required)
            )
          )
        })
      );
    });
  }


  patchCommercial(details: any) {
    this.bilanForm.patchValue({
      prospections: details.prospections,
      suivis_dossiers: details.suivis_dossiers,
      recouvrements: details.recouvrements,
      nombre_clients: details.nombre_clients,
      chiffre_affaire: details.chiffre_affaire,
      resultats_perspectives: details.resultats_perspectives
    });
  }
  patchComptable(details: any) {
    const mois = this.getMoisDuTrimestre(this.bilanForm.get('trimestre')?.value);

    this.bilanForm.patchValue({
      mois1: details[mois[0]] || '',
      mois2: details[mois[1]] || '',
      mois3: details[mois[2]] || ''
    });
  }


  patchCoursier(details: any) {
    this.clearFormArray(this.courses);
    details.courses?.forEach((c: any) => this.addCourse(c));
  }


  loadEmployeData(): void {
    const user = this.authSvr.getUser();

    if (user?.employe) {
      this.employe.set(user.employe);
    }
  }

  loadBilan(id: string) {
    this.isLoading.set(true);
    this.bilanSvr.getBilanBySlug(id).subscribe({
      next: (bilan) => {
        this.bilanForm.patchValue({
          employe_id: bilan.employe_id,
          service_id: bilan.service_id,
          annee: Number(bilan.annee),
          trimestre: bilan.trimestre,
          introduction: bilan.introduction,
          commentaire: bilan.commentaire
        });
        const detailsObject = this.mapDetailsArrayToObject(bilan.details);
        // console.log('DETAILS OBJ:', detailsObject);
        this.patchDetails(detailsObject);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors du chargement du bilan',
          'Fermer',
          { duration: 4000, panelClass: 'toast-error' }
        );
        this.isLoading.set(false);
      }
    });
  }


  mapDetailsArrayToObject(detailsArray: any[]): any {
    const result: any = {};

    detailsArray.forEach(item => {
      result[item.cle] = item.valeur;
    });

    return result;
  }



  initForm(): void {
    // const serviceCode = this.employe()?.service?.nom?.toLowerCase();
    const employe = this.employe();
    const service = employe?.service;
    const serviceCode = service?.nom?.toLowerCase();
    this.bilanForm = this.fb.group({
      employe_id: [this.employe()?.slug, Validators.required],
      service_id: [service?.slug ?? null],
      annee: [this.currentYear, Validators.required],
      trimestre: [this.getCurrentTrimestre(), Validators.required],
      introduction: ['', Validators.required],
      commentaire: ['']
    });

    // Ajouter les champs spécifiques selon le service
    if (serviceCode == 'rédaction') {
      this.initJournalisteFields();
    } else if (serviceCode == 'commercial') {
      this.initCommercialFields();
    } else if (serviceCode == 'développement') {
      this.initDeveloppeurFields();
    } else if (serviceCode === 'comptabilité') {
      this.initComptableFields();
    } else if(this.isCoursier()){
      this.initCoursierFields();
    } else {
      this.initGenericFields();
    }
  }

  initJournalisteFields(): void {
    this.bilanForm.addControl('nombre_articles', this.fb.control(0, [Validators.required, Validators.min(0)]));
    this.bilanForm.addControl('nombre_interviews', this.fb.control(0, [Validators.required, Validators.min(0)]));
    this.bilanForm.addControl('nombre_reportages', this.fb.control(0, [Validators.required, Validators.min(0)]));
    this.bilanForm.addControl('nombre_videos', this.fb.control(0, [Validators.required, Validators.min(0)]));
    this.bilanForm.addControl('articles', this.fb.array([]));
  }

  initCommercialFields(): void {
    this.bilanForm.addControl('prospections', this.fb.control('', Validators.required));
    this.bilanForm.addControl('suivis_dossiers', this.fb.control('', Validators.required));
    this.bilanForm.addControl('recouvrements', this.fb.control('', Validators.required));
    this.bilanForm.addControl('nombre_clients', this.fb.control(0, [Validators.required, Validators.min(0)]));
    this.bilanForm.addControl('chiffre_affaire', this.fb.control(0, [Validators.required, Validators.min(0)]));
    this.bilanForm.addControl('resultats_perspectives', this.fb.control('', Validators.required));
  }

  initDeveloppeurFields(): void {
    this.bilanForm.addControl('projets', this.fb.array([]));
  }

  initComptableFields(): void {
    this.bilanForm.addControl('mois1', this.fb.control('', Validators.required));
    this.bilanForm.addControl('mois2', this.fb.control('', Validators.required));
    this.bilanForm.addControl('mois3', this.fb.control('', Validators.required));
  }

  initCoursierFields(): void {
    this.bilanForm.addControl('courses', this.fb.array([]));
  }


  initGenericFields(): void {
    // Pour les employés sans cahier de charges spécifique
    // Uniquement introduction et commentaire (déjà présents)
  }

  // Getters pour les FormArrays
  get articles(): FormArray {
    return this.bilanForm.get('articles') as FormArray;
  }

  get projets(): FormArray {
    return this.bilanForm.get('projets') as FormArray;
  }

  get courses(): FormArray {
    return this.bilanForm.get('courses') as FormArray;
  }

  // Gestion des articles (Journalistes)
  addArticle(): void {
    const articleGroup = this.fb.group({
      type: ['article', Validators.required],
      lien: ['', [Validators.required, Validators.pattern('https?://.+'), this.duplicateLinkValidator(this.articles)]]
    });
    this.articles.push(articleGroup);
  }

  duplicateLinkValidator(formArray: FormArray) {
    return (control: AbstractControl) => {
      if (!control.value) return null;

      const value = control.value.trim();
      const duplicates = formArray.controls
        .map(c => c.get('lien')?.value?.trim())
        .filter(v => v === value);

      return duplicates.length > 1 ? { duplicateLink: true } : null;
    };
  }



  removeArticle(index: number): void {
    this.articles.removeAt(index);
  }

  getArticleTaches(index: number): FormArray {
    return this.projets.at(index).get('taches') as FormArray;
  }

  // Gestion des projets (Développeurs)
  addProjet(): void {
    const projetGroup = this.fb.group({
      nom: ['', Validators.required],
      taches: this.fb.array([this.fb.control('', Validators.required)]),
      statut: ['en_cours', Validators.required]
    });
    this.projets.push(projetGroup);
  }

  removeProjet(index: number): void {
    this.projets.removeAt(index);
  }

  addTache(projetIndex: number): void {
    const taches = this.projets.at(projetIndex).get('taches') as FormArray;
    taches.push(this.fb.control('', Validators.required));
  }

  removeTache(projetIndex: number, tacheIndex: number): void {
    const taches = this.projets.at(projetIndex).get('taches') as FormArray;
    if (taches.length > 1) {
      taches.removeAt(tacheIndex);
    }
  }

  addCourse(course?: any) {
    const courseGroup = this.fb.group({
      date: [course?.date || '', Validators.required],
      heure_arrive: [course?.heure_arrive || '', Validators.required],
      heure_depart: [course?.heure_depart || '', Validators.required],
      tache_effectuer: [course?.tache_effectuer || '', Validators.required],
      lieu: [course?.lieu || '', Validators.required],
      observation: [course?.observation || '']
    });

    this.courses.push(courseGroup);
  }

  removeCourse(index: number) {
    this.courses.removeAt(index);
  }

  getCurrentTrimestre(): number {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 1;
    if (month <= 6) return 2;
    if (month <= 9) return 3;
    return 4;
  }

  getServiceCode(): string | undefined {
    return this.employe()?.service?.nom?.toLowerCase();
  }

  isJournaliste(): boolean {
    return this.getServiceCode() === 'rédaction';
  }

  isCommercial(): boolean {
    return this.getServiceCode() === 'commercial';
  }

  isDeveloppeur(): boolean {
    return this.getServiceCode() === 'développement';
  }

  isComptable(): boolean {
    return this.getServiceCode() === 'comptabilité';
  }

  isCoursier(): boolean {
    return !this.employe()?.id_service;
  }

  onSubmit(): void {
    if (this.bilanForm.invalid) {
      this.markFormGroupTouched(this.bilanForm);
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.prepareFormData();

    const request$ = this.isEditMode()
      ? this.bilanSvr.updateBilan(this.bilanId!, formData)
      : this.bilanSvr.addBilan(formData);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          this.isEditMode() ? 'Bilan modifié avec succès' : 'Bilan envoyé avec succès',
          'Fermer',
          { duration: 3000, panelClass: 'toast-success' }
        );
        this.router.navigate(['/mes-bilans']);
      },
      error: err => {
        this.isSubmitting.set(false);
        this.snackBar.open(
          err.error?.message || 'Erreur lors de l’opération',
          'Fermer',
          { duration: 4000, panelClass: 'toast-error' }
        );
      }
    });
  }


  prepareFormData(): any {
    const formValue = this.bilanForm.value;
    const details: any = {};

    const serviceCode = this.getServiceCode();

    if (serviceCode === 'rédaction') {
      details.nombre_articles = formValue.nombre_articles;
      details.nombre_interviews = formValue.nombre_interviews;
      details.nombre_reportages = formValue.nombre_reportages;
      details.nombre_videos = formValue.nombre_videos;
      details.articles = formValue.articles;
    } else if (serviceCode === 'commercial') {
      details.prospections = formValue.prospections;
      details.suivis_dossiers = formValue.suivis_dossiers;
      details.recouvrements = formValue.recouvrements;
      details.nombre_clients = formValue.nombre_clients;
      details.chiffre_affaire = formValue.chiffre_affaire;
      details.resultats_perspectives = formValue.resultats_perspectives;
    } else if (serviceCode === 'développement') {
      details.projets = formValue.projets;
    } else if (serviceCode === 'comptabilité') {
      const mois = this.getMoisDuTrimestre(formValue.trimestre);

      details[mois[0]] = formValue.mois1;
      details[mois[1]] = formValue.mois2;
      details[mois[2]] = formValue.mois3;
    } else if (this.isCoursier()) {
      details.courses = formValue.courses;
    }

    return {
      employe_id: formValue.employe_id,
      service_id: formValue.service_id,
      annee: formValue.annee,
      trimestre: formValue.trimestre,
      introduction: formValue.introduction,
      commentaire: formValue.commentaire,
      details
    };
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  clearFormArray(array: FormArray) {
    while (array.length) {
      array.removeAt(0);
    }
  }

}
