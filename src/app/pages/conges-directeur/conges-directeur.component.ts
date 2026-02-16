import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../material.module';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { CongesService } from '../../services/conges.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
  documents?: {
    id: number;
    slug: string;
    id_conge: string;
    nom_fichier:string;
    url?: string; // si ton API renvoie l’url
  }[];
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
    emailPersonnel?: string;
  };
}

interface Stats {
  total: number;
  enAttente: number;
  approuve: number;
  rejete: number;
}

@Component({
  selector: 'app-conges-directeur',
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './conges-directeur.component.html',
  styleUrl: './conges-directeur.component.scss'
})
export class CongesDirecteurComponent {

  conges: Conge[] = [];
  congesEnAttente: Conge[] = [];
  congesTraites: Conge[] = [];
  congesTraitesFiltered: Conge[] = [];

  stats: Stats = {
    total: 0,
    enAttente: 0,
    approuve: 0,
    rejete: 0
  };

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  totalItems = 0;

  // Filtres
  searchTerm = '';
  selectedStatut = '';
  selectedType = '';
  dateDebut = '';
  dateFin = '';

  // Tri
  sortField = 'date_demande';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Colonnes tableau
  displayedColumns: string[] = ['employe', 'type', 'periode', 'duree', 'statut', 'date_demande', 'actions'];

  // Modals
  selectedConge: Conge | null = null;
  showResponseModal = false;
  showDetailsModal = false;
  showDeleteModal = false;

  // Formulaire de réponse
  responseForm: FormGroup;
  isSubmitting = false;
  isLoading = true;

  // Animation
  fadeIn = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private congeSvr: CongesService,
    private snackBar: MatSnackBar
  ) {
    this.responseForm = this.fb.group({
      commentaire_admin: [''],
      statut: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadConges();
    setTimeout(() => this.fadeIn = true, 100);
  }

  loadConges(): void {
    this.isLoading = true;
    // Simuler un appel API - Remplacer par votre service
    this.congeSvr.getList().subscribe({
      next: (response) => {
        this.conges = response;
        this.processConges();
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Erreur lors du chargement des congés','Fermer',
          {duration:4000}
        )
        console.error('Erreur lors du chargement des congés', err);
        this.isLoading = false;
      }
    });

  }

  processConges(): void {
    this.congesEnAttente = this.conges.filter(c => c.statut === 1);
    this.congesTraites = this.conges.filter(c => c.statut !== 1);
    this.congesTraitesFiltered = [...this.congesTraites];

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
    let filtered = [...this.congesTraites];
    // Filtre par recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.employe.nom.toLowerCase().includes(term) ||
        c.employe.prenom.toLowerCase().includes(term) ||
        c.type.nom.toLowerCase().includes(term)
      );
    }

    // Filtre par statut
    if (this.selectedStatut) {
      filtered = filtered.filter(c => c.statut === parseInt(this.selectedStatut));
    }

    // Filtre par type
    if (this.selectedType) {
      filtered = filtered.filter(c => c.id_type === this.selectedType);
    }

    // Filtre par date de début
    if (this.dateDebut) {
      filtered = filtered.filter(c => new Date(c.debut) >= new Date(this.dateDebut));
    }

    // Filtre par date de fin
    if (this.dateFin) {
      filtered = filtered.filter(c => new Date(c.fin) <= new Date(this.dateFin));
    }

    this.congesTraitesFiltered = filtered;
    this.totalItems = filtered.length;
    this.applySorting();
  }

  applySorting(): void {
    this.congesTraitesFiltered.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortField) {
        case 'employe':
          valueA = `${a.employe.nom} ${a.employe.prenom}`;
          valueB = `${b.employe.nom} ${b.employe.prenom}`;
          break;
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
    return this.congesTraitesFiltered.slice(start, end);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatut = '';
    this.selectedType = '';
    this.dateDebut = '';
    this.dateFin = '';
    this.applyFilters();
  }

  openResponseModal(conge: Conge): void {
    this.selectedConge = conge;
    this.responseForm.reset();
    this.showResponseModal = true;
  }

  closeResponseModal(): void {
    this.showResponseModal = false;
    this.selectedConge = null;
    this.responseForm.reset();
  }

  setStatut(statut: number): void {
    this.responseForm.patchValue({ statut });

    // Rendre le commentaire obligatoire si rejet
    if (statut === 3) {
      this.responseForm.get('commentaire_admin')?.setValidators([Validators.required]);
    } else {
      this.responseForm.get('commentaire_admin')?.clearValidators();
    }
    this.responseForm.get('commentaire_admin')?.updateValueAndValidity();
  }

  submitResponse(): void {
    if (this.responseForm.invalid) {
      this.responseForm.markAllAsTouched();
      return;
    }

    if (!this.selectedConge) return;

    this.isSubmitting = true;

    const data = {
      statut: this.responseForm.value.statut,
      commentaire_admin: this.responseForm.value.commentaire_admin || ''
    };

    // Appel API
    this.congeSvr.responseConge(this.selectedConge.slug, data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.closeResponseModal();
        this.loadConges();
        // Afficher un message de succès
      },
      error: (err) => {
        console.error('Erreur lors de la réponse', err);
        this.isSubmitting = false;
        this.snackBar.open(err.error.message || 'Erreur lors de la suppression de la demande','Fermer',
          {duration:4000}
        )
      }
    });
  }

  get formattedComment(): string {
    if (!this.selectedConge?.commentaire_admin) return '';

    return this.selectedConge.commentaire_admin.replace(/\\n/g, '\n');
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

    // Appel API
    this.congeSvr.deleteConge(this.selectedConge.slug).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.closeDeleteModal();
        this.loadConges();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression', err);
        this.isSubmitting = false;
        this.snackBar.open(err.error.message || 'Erreur lors de la suppression de la demande','Fermer',
          {duration:4000}
        )
      }
    });
  }

  getStatutLabel(statut: number): string {
    switch (statut) {
      case 1: return 'En attente';
      case 2: return 'Acceptée';
      case 3: return 'Refusée';
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
}
