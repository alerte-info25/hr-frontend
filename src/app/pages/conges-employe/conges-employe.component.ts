import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CongesService } from '../../services/conges.service';
import { AuthService } from '../../services/auth.service';
import { TypeCongesService } from '../../services/type-conges.service';

interface CongeDocument {
  id: number;
  slug: string;
  id_conge: string;
  chemin: string;
  nom_fichier: string;
  extension: string;
  taille: number;
  type: string;
  url: string;
  taille_formatee?: string;
}

interface Conge {
  id: number;
  slug: string;
  date_demande: string;
  debut: string;
  fin: string;
  statut: number;
  raison: string;
  date_reponse?: string;
  commentaire_admin?: string;
  document?: string; // Ancien champ (rétrocompatibilité)
  documents?: CongeDocument[]; // Nouveau champ
  id_type: string;
  id_employe: string;
  type: {
    id: number;
    nom: string;
    slug: string;
  };
  employe: {
    id: number;
    nom: string;
    prenom: string;
    slug: string;
  };
}

interface TypeConge {
  id: number;
  nom: string;
  slug: string;
  description?: string;
}

interface Stats {
  total: number;
  enAttente: number;
  approuve: number;
  rejete: number;
}

@Component({
  selector: 'app-conge-employe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './conges-employe.component.html',
  styleUrl: './conges-employe.component.scss'
})
export class CongesEmployeComponent implements OnInit {
  conges: Conge[] = [];
  congesFiltered: Conge[] = [];
  typesConges: TypeConge[] = [];
  user:any;
  currentEmployeeSlug:string = '';

  stats: Stats = {
    total: 0,
    enAttente: 0,
    approuve: 0,
    rejete: 0
  };

  // Pagination
  pageSize = 8;
  pageIndex = 0;
  pageSizeOptions = [5, 8, 10, 20];
  totalItems = 0;

  // Filtres
  searchTerm = '';
  selectedStatut = '';
  dateDebut = '';
  dateFin = '';

  // Tri
  sortField = 'date_demande';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Modals
  showFormModal = false;
  showDetailsModal = false;
  showDeleteModal = false;
  selectedConge: Conge | null = null;
  isEditMode = false;

  // Formulaire
  congeForm: FormGroup;
  selectedFiles: File[] = [];
  existingDocuments: CongeDocument[] = []; // Documents déjà uploadés (en mode édition)
  maxFiles = 3;
  isSubmitting = false;
  isLoading = true;

  // Animation
  fadeIn = false;

  constructor(
    private fb: FormBuilder,
    private congeService: CongesService,
    private authSvr: AuthService,
    private snackBar: MatSnackBar,
    private typeCongeSvr: TypeCongesService
  ) {
    this.congeForm = this.fb.group({
      dateDemande: [new Date(), Validators.required],
      debut: ['', Validators.required],
      fin: ['', Validators.required],
      raison: ['', [Validators.required, Validators.minLength(10)]],
      id_type: ['', Validators.required],
      document: [null]
    });
  }

  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    if(this.user){
      this.currentEmployeeSlug = this.user.employe.slug
    }
    this.loadTypesConges();
    this.loadConges();
    setTimeout(() => this.fadeIn = true, 100);
  }

  loadTypesConges(): void {
   this.typeCongeSvr.getList().subscribe({
    next:(data) => {
      this.typesConges = data;
    },
    error:(err)=>{
      this.snackBar.open(err.error.message || 'Erreur lors du chargement des types de congés,Recharger la page','Fermer',{duration:5000})
      console.error(err);
    }
   })
  }

  loadConges(): void {
    this.isLoading = true;
    this.congeService.getCongeByEmp(this.currentEmployeeSlug).subscribe({
      next: (response) => {
        this.conges = Array.isArray(response) ? response : [];
        this.processConges();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des congés', error);
        this.showNotification('Erreur lors du chargement des congés', 'error');
        this.isLoading = false;
      }
    });
  }

  processConges(): void {
    this.congesFiltered = [...this.conges];
    this.calculateStats();
    this.applyFilters();
  }

  calculateStats(): void {
    this.stats.total = this.conges.length;
    this.stats.enAttente = this.conges.filter(c => c.statut === 1).length;
    this.stats.approuve = this.conges.filter(c => c.statut === 2).length;
    this.stats.rejete = this.conges.filter(c => c.statut === 3).length;
  }

  applyFilters(): void {
    let filtered = [...this.conges];

    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.type.nom.toLowerCase().includes(term) ||
        c.raison.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.selectedStatut) {
      filtered = filtered.filter(c => c.statut === parseInt(this.selectedStatut));
    }

    // Filtre par date de début
    if (this.dateDebut) {
      filtered = filtered.filter(c => new Date(c.debut) >= new Date(this.dateDebut));
    }

    // Filtre par date de fin
    if (this.dateFin) {
      filtered = filtered.filter(c => new Date(c.fin) <= new Date(this.dateFin));
    }

    this.congesFiltered = filtered;
    this.totalItems = filtered.length;
    this.applySorting();
  }

  applySorting(): void {
    this.congesFiltered.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortField) {
        case 'type':
          valueA = a.type.nom;
          valueB = b.type.nom;
          break;
        case 'debut':
          valueA = new Date(a.debut);
          valueB = new Date(b.debut);
          break;
        case 'date_demande':
          valueA = new Date(a.date_demande);
          valueB = new Date(b.date_demande);
          break;
        case 'statut':
          valueA = a.statut;
          valueB = b.statut;
          break;
        default:
          valueA = a[this.sortField as keyof Conge];
          valueB = b[this.sortField as keyof Conge];
      }

      const comparison = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getPaginatedData(): Conge[] {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    return this.congesFiltered.slice(start, end);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatut = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.applyFilters();
  }

  openNewCongeModal(): void {
    this.isEditMode = false;
    this.selectedConge = null;
    this.congeForm.reset({
      dateDemande: new Date(),
      debut: '',
      fin: '',
      raison: '',
      id_type: '',
      document: null
    });
    this.selectedFiles = [];
    this.existingDocuments = [];
    this.showFormModal = true;
  }

  openEditModal(conge: Conge): void {
    if (conge.statut !== 1) {
      this.showNotification(
        "Cette demande a déjà été traitée. La direction sera notifiée de toute modification.",
        "warning"
      );

      // return;
    }

    this.isEditMode = true;
    this.selectedConge = conge;
    this.congeForm.patchValue({
      dateDemande: new Date(conge.date_demande),
      debut: new Date(conge.debut),
      fin: new Date(conge.fin),
      raison: conge.raison,
      id_type: conge.id_type
    });
    this.selectedFiles = [];
    this.existingDocuments = conge.documents || [];
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.selectedConge = null;
    this.congeForm.reset();
    this.selectedFiles = [];
    this.existingDocuments = [];
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];

    // Vérifier le nombre total de fichiers
    const totalFiles = this.selectedFiles.length + this.existingDocuments.length + files.length;
    if (totalFiles > this.maxFiles) {
      this.showNotification(`Vous ne pouvez télécharger que ${this.maxFiles} documents maximum`, 'error');
      event.target.value = ''; // Reset input
      return;
    }

    // Validation de chaque fichier
    for (const file of files) {
      // Vérifier le type
      const allowedTypes = ['application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        this.showNotification('Seuls les fichiers PDF sont autorisés', 'error');
        event.target.value = '';
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showNotification('Chaque fichier ne doit pas dépasser 5MB', 'error');
        event.target.value = '';
        return;
      }

      // Vérifier les doublons de nom
      if (this.selectedFiles.some(f => f.name === file.name)) {
        this.showNotification(`Le fichier "${file.name}" est déjà sélectionné`, 'warning');
        continue;
      }

      this.selectedFiles.push(file);
    }

    if (files.length > 0) {
      this.showNotification(`${files.length} fichier(s) ajouté(s) avec succès`, 'success');
    }

    event.target.value = ''; // Reset input pour permettre de resélectionner
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.showNotification('Fichier retiré', 'success');
  }

  removeExistingDocument(doc: CongeDocument): void {
    const index = this.existingDocuments.findIndex(d => d.slug === doc.slug);
    if (index !== -1) {
      this.existingDocuments.splice(index, 1);
      this.showNotification('Document retiré (sera supprimé lors de la sauvegarde)', 'success');
    }
  }

  getTotalFilesCount(): number {
    return this.selectedFiles.length + this.existingDocuments.length;
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1048576) {
      return (bytes / 1048576).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    }
    return bytes + ' B';
  }

  submitForm(): void {
    if (this.congeForm.invalid) {
      this.congeForm.markAllAsTouched();
      this.showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    // Valider les dates
    const debut = new Date(this.congeForm.value.debut);
    const fin = new Date(this.congeForm.value.fin);

    if (fin <= debut) {
      this.showNotification('La date de fin doit être postérieure à la date de début', 'error');
      return;
    }

    // Vérifier que la date de début n'est pas dans le passé (sauf en mode édition)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (debut < today && !this.isEditMode) {
      this.showNotification('La date de début ne peut pas être dans le passé', 'error');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('dateDemande', this.formatDateForAPI(this.congeForm.value.dateDemande));
    formData.append('debut', this.formatDateForAPI(this.congeForm.value.debut));
    formData.append('fin', this.formatDateForAPI(this.congeForm.value.fin));
    formData.append('raison', this.congeForm.value.raison);
    formData.append('id_type', this.congeForm.value.id_type);
    formData.append('id_employe', this.currentEmployeeSlug);

    // Ajouter les nouveaux documents
    this.selectedFiles.forEach((file, index) => {
      formData.append('documents[]', file, file.name);
    });

    // En mode édition, envoyer les slugs des documents à conserver
    if (this.isEditMode) {
      this.existingDocuments.forEach((doc, index) => {
        formData.append('keep_documents[]', doc.slug);
      });
    }

    const request$ = this.isEditMode && this.selectedConge
      ? this.congeService.updateConge(this.selectedConge.slug, formData)
      : this.congeService.addConge(formData);

    request$.subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.closeFormModal();
        this.loadConges();
        const message = this.isEditMode
          ? 'Demande modifiée avec succès'
          : 'Demande créée avec succès';
        this.showNotification(message, 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la soumission', error);
        this.isSubmitting = false;
        const errorMessage = error.error?.message || 'Erreur lors de la soumission de la demande';
        this.showNotification(errorMessage, 'error');
      }
    });
  }

  openDetailsModal(conge: Conge): void {
    this.selectedConge = conge;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedConge = null;
  }

  openDeleteModal(conge: Conge): void {
    if (conge.statut !== 1) {
      this.showNotification('Seules les demandes en attente peuvent être supprimées', 'warning');
      return;
    }
    this.selectedConge = conge;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedConge = null;
  }

  confirmDelete(): void {
    if (!this.selectedConge) return;

    this.isSubmitting = true;

    this.congeService.deleteConge(this.selectedConge.slug).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.closeDeleteModal();
        this.loadConges();
        this.showNotification('Demande supprimée avec succès', 'success');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression', error);
        this.isSubmitting = false;
        this.showNotification('Erreur lors de la suppression de la demande', 'error');
      }
    });
  }

  getStatutLabel(statut: number): string {
    switch (statut) {
      case 1: return 'En attente';
      case 2: return 'Approuvé';
      case 3: return 'Rejeté';
      default: return 'Inconnu';
    }
  }

  getStatutClass(statut: number): string {
    switch (statut) {
      case 1: return 'statut-attente';
      case 2: return 'statut-approuve';
      case 3: return 'statut-rejete';
      default: return '';
    }
  }

  getStatutIcon(statut: number): string {
    switch (statut) {
      case 1: return 'schedule';
      case 2: return 'check_circle';
      case 3: return 'cancel';
      default: return 'help';
    }
  }

  calculateDuration(debut: string, fin: string): number {
    const start = new Date(debut);
    const end = new Date(fin);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateForAPI(date: any): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    const panelClass = type === 'success'
      ? 'snackbar-success'
      : type === 'error'
      ? 'snackbar-error'
      : 'snackbar-warning';

    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }

  canModifyOrDelete(conge: Conge): boolean {
    return conge.statut === 1;
  }

  getTypeNom(typeSlug: string): string {
    const type = this.typesConges.find(t => t.slug === typeSlug);
    return type ? type.nom : 'Inconnu';
  }
}
