import { Component, signal } from '@angular/core';
import { DemandeService } from '../../demande.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ObjetService } from '../../services/objet.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployesService } from '../../services/employes.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { LoadingComponent } from '../loading/loading.component';
import { Router, RouterLink } from '@angular/router';
import { SanctionService } from '../../services/sanction.service';
interface StatusConfig {
  label: string;
  color: string;
  icon: string;
}
@Component({
  selector: 'app-demande-explications',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingComponent, RouterLink],
  templateUrl: './demande-explications.component.html',
  styleUrl: './demande-explications.component.scss'
})
export class DemandeExplicationsComponent {
  isLoading = true;
  userRole = '';
  showReponseModal: boolean = false;
  selectedDemande: any = null;
  currentEmployeSlug = '';
  demandes: any[] = [];
  demandeForm!: FormGroup;
  reponseForm!: FormGroup;
  showNewDemande = false;
  employes:any[] = [];
  objets:any[] = [];
  filterStatus = 'all';
  searchTerm = '';
  selectedFiles: File[] = [];
  // sanction
  showSanctionModal: boolean = false;
  selectedDemandeForSanction: any = null;
  currentUserSlug = '';
  sanctionForm!: FormGroup;
  typesSanctions = [
    { value: 'avertissement', label: 'Avertissement' },
    { value: 'blame', label: 'Blâme' },
    { value: 'mise_a_pied', label: 'Mise à pied' },
    { value: 'retrogradation', label: 'Rétrogradation' },
    { value: 'licenciement', label: 'Licenciement' },
  ];
  constructor(
    private demandeService: DemandeService,
    private objetService: ObjetService,
    private empSvr: EmployesService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private sanctionService: SanctionService
  ) {}


  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    this.userRole = user?.role?.libelle?.toLowerCase();
    this.currentEmployeSlug = user?.employe?.slug;
    this.currentUserSlug = user?.employe?.slug;
    const role = this.auth.getRole();

    this.loadDemandes();
    this.loadEmployes();
    this.loadObjets();
    this.initForms();

  }
  initForms(): void {
    this.demandeForm = this.fb.group({
      id_employe: ['', Validators.required],
      id_objet: ['', Validators.required],
      description: ['', Validators.required],
    });
    this.reponseForm = this.fb.group({
      reponse: ['']  // champs obligatoire si tu veux : [ '', Validators.required ]
    });

    this.sanctionForm = this.fb.group({
      type: ['', Validators.required],
      motif: ['', Validators.required],
    });
  }

  loadDemandes(): void {
    this.isLoading = true;
    if (this.auth.isDG()) {
      this.demandeService.getList().subscribe({
        next: (data) => {
          this.demandes = data ?? [];
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(err.error.message || 'Erreur lors du chargement des demandes.', 'Fermer', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.isLoading = true;
      this.demandeService.getListByEmp(this.currentEmployeSlug).subscribe({
        next: (data) => {
          this.demandes = data;
          this.isLoading = false;
        }
        , error: (err) => {
          this.isLoading = false;
          this.snackBar.open(err.error.message || 'Erreur lors du chargement des demandes.', 'Fermer', {
            duration: 4000,
            verticalPosition: 'top'
          });
        }
      });
    }
  }


  loadEmployes(): void {
    this.isLoading = true;
    this.empSvr.getList().subscribe({
      next: (data) => {
        this.employes = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Erreur lors du chargement des employés.', 'Fermer', {
          duration: 4000,
          verticalPosition: 'top'
        });
      }
    });
  }

  loadObjets(): void {
    this.isLoading = true;
    this.objetService.getList().subscribe({
      next: (data) => {
        this.objets = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Erreur lors du chargement des objets.', 'Fermer', {
          duration: 4000,
          verticalPosition: 'top'
        });
      }
    });
  }

  get filteredDemandes(): any[] {
    if (!Array.isArray(this.demandes)) {
      return [];
    }

    const term = this.searchTerm?.toLowerCase() || '';

    return this.demandes.filter(d => {
      const matchesStatus =
        this.filterStatus === 'all' || d?.statut === +this.filterStatus;

      const matchesSearch =
        term === '' ||
        d?.employe?.nom?.toLowerCase().includes(term) ||
        d?.employe?.prenom?.toLowerCase().includes(term) ||
        d?.objet?.libelle?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }


  get totalDemandes(): number {
    return Array.isArray(this.demandes) ? this.demandes.length : 0;
  }


  get demandesEnAttente(): number {
    return Array.isArray(this.demandes)
      ? this.demandes.filter(d => d?.statut === 1).length
      : 0;
  }


  get demandesRepondues(): number {
    return Array.isArray(this.demandes)
      ? this.demandes.filter(d => d?.statut === 2).length
      : 0;
  }


  getStatusConfig(statut: number): StatusConfig {
    switch(statut) {
      case 1:
        return {
          label: 'En attente',
          color: 'status-pending',
          icon: 'clock'
        };
      case 2:
        return {
          label: 'Répondu',
          color: 'status-completed',
          icon: 'check-circle'
        };
      default:
        return {
          label: 'Inconnu',
          color: 'status-unknown',
          icon: 'alert-circle'
        };
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getInitiales(employe: any): string {
    return employe.prenom.charAt(0) + employe.nom.charAt(0);
  }

  openNewDemande(): void {
    this.showNewDemande = true;
  }

  closeNewDemande(): void {
    this.showNewDemande = false;
  }

  submitNewDemande() {
    if (this.demandeForm.invalid) {
      return;
    }
    this.isLoading = true;
    const data = this.demandeForm.value;
    this.demandeService.addDemande(data).subscribe({
      next: (res) => {
        this.isLoading = false
        this.snackBar.open(res.message || 'Demande d\'explications créée avec succès.', 'Fermer', {
          duration: 4000,
          verticalPosition: 'top'
        });
        this.loadDemandes();
        this.initForms();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Erreur lors de la création de la demande.', 'Fermer', {
          duration: 4000,
          verticalPosition: 'top'
        });
      }

    });

    this.closeNewDemande();
  }

  isEmploye(): boolean {
    return this.auth.isEmploye();
  }

  isDRHOrDG(): boolean {
    return this.auth.isDG();
  }
  isDG(): boolean {
    return this.auth.isOnlyDG();
  }
  openReponseModal(demande: any): void {
    // this.selectedDemande = demande;
    // this.showReponseModal = true;
    // // Optionnel : reset du formulaire
    // this.reponseForm.reset();
    this.router.navigate(['/detail-demande/', demande.slug]);
  }

  // Fermer le modal
  closeReponseModal(): void {
    this.showReponseModal = false;
    this.selectedDemande = null;
  }


  // Soumettre la réponse
  submitReponse(): void {
    if (this.reponseForm.invalid || !this.selectedDemande) return;

    const formData = new FormData();

    // Données principales
    formData.append('id_demande', this.selectedDemande.slug);
    formData.append('id_employe', this.currentEmployeSlug);
    formData.append('reponse', this.reponseForm.value.reponse);

    // Fichiers PDF (plusieurs)
    this.selectedFiles.forEach((file) => {
      formData.append('pieces_jointes[]', file);
    });


    this.demandeService.repondre(formData).subscribe({
      next: (res) => {
        this.snackBar.open('Réponse envoyée avec succès', 'Fermer', { duration: 3000 });
        this.closeReponseModal();
        this.selectedFiles = [];
        this.reponseForm.reset();
        this.loadDemandes();
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors de l’envoi',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }


  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files) return;

    this.selectedFiles = Array.from(input.files).filter(file =>
      file.type === 'application/pdf'
    );
  }
  openDetailsDemande(demande: any): void {
    this.router.navigate(['/detail-demande/', demande.slug]);
  }

  // SANCTIONNER

  openSanctionModal(demande: any): void {
    this.selectedDemandeForSanction = demande;
    this.showSanctionModal = true;
    this.sanctionForm.reset({
      type: '',
      motif: '',
      date_sanction: new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Ferme le modal de sanction
   */
  closeSanctionModal(): void {
    this.showSanctionModal = false;
    this.selectedDemandeForSanction = null;
    this.sanctionForm.reset();
  }

  /**
   * Soumet la sanction
   */
  submitSanction(): void {
    if (this.sanctionForm.invalid || !this.selectedDemandeForSanction) {
      this.snackBar.open('Veuillez remplir tous les champs requis', 'Fermer', {
        duration: 3000,
        verticalPosition: 'top'
      });
      return;
    }

    this.isLoading = true;

    const sanctionData = {
      id_employe: this.selectedDemandeForSanction.employe.slug,
      id_demande: this.selectedDemandeForSanction.slug,
      id_reponse: this.selectedDemandeForSanction.reponse.slug,
      id_decideur: this.currentUserSlug,
      type: this.sanctionForm.value.type,
      motif: this.sanctionForm.value.motif,
    };

    this.sanctionService.addSanction(sanctionData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.snackBar.open(
          res.message || 'Sanction appliquée avec succès',
          'Fermer',
          { duration: 4000, verticalPosition: 'top' }
        );
        this.closeSanctionModal();
        this.loadDemandes();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de l\'application de la sanction',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

  /**
   * Vérifie si une demande peut être sanctionnée
   * (doit avoir une réponse et pas encore de sanction)
   */
  canBeSanctioned(demande: any): boolean {
    return demande.statut === 2 && demande.reponse && !demande.sanction;
  }

}
