import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DemandeService } from '../../demande.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

interface Employe {
  id: number;
  slug: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  matricule?: string;
  poste?: string;
}

interface Objet {
  id: number;
  slug: string;
  libelle: string;
  description?: string;
}

interface PieceReponse {
  id: number;
  slug: string;
  reponse_id: string;
  type: string;
  nom_fichier: string;
  chemin: string;
  extension: string;
  taille: number;
}

interface ReponseDemande {
  id: number;
  slug: string;
  id_demande: string;
  id_employe: string;
  reponse: string;
  created_at: string;
  updated_at: string;
  employe?: Employe;
  pieces?: PieceReponse[];
}

interface Demande {
  id: number;
  slug: string;
  id_employe: string;
  id_objet: string;
  description: string;
  statut: number;
  created_at: string;
  updated_at: string;
  employe?: Employe;
  objet?: Objet;
  reponse?: ReponseDemande;
}

interface StatusConfig {
  label: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-details-demandes-explications',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './details-demandes-explications.component.html',
  styleUrl: './details-demandes-explications.component.scss'
})
export class DetailsDemandesExplicationsComponent {

  demande: any | null = null;
  loading = true;
  isLoading = false;
  showReponseModal = false;
  reponseForm: FormGroup;
  selectedFiles: File[] = [];
  statusConfig!: StatusConfig;
  currentEmployeSlug = '';
  // Statuts
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private demandeService: DemandeService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    private location: Location
  ) {
    this.reponseForm = this.fb.group({
      reponse: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadDemandeDetail(slug);
    }
    const user = this.auth.getCurrentUser();
    this.currentEmployeSlug = user?.employe?.slug;
  }

  /**
   * Charger les détails de la demande
   */
  loadDemandeDetail(slug: string): void {
    this.loading = true;
    this.demandeService.getDemandeDetail(slug).subscribe({
      next: (data) => {
        this.demande = data;
        this.statusConfig = this.getStatusConfig(this.demande.statut);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la demande :', err);
        this.loading = false;
      }
    })
  }

  /**
   * Retour à la liste
   */
  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/permissions']);
    }
  }

  /**
   * Obtenir les initiales d'un employé
   */
  getInitiales(employe: any): string {
    if (!employe) return '?';
    const prenom = employe.prenom || '';
    const nom = employe.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase();
  }

  /**
   * Formatter une date
   */
  formatDate(date: string): string {
    if (!date) return '';

    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return d.toLocaleDateString('fr-FR', options);
  }

  /**
   * Formatter la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Vérifier si l'utilisateur est un employé
   */
  isEmploye(): boolean {
    return this.auth.isEmploye();
  }
  openReponseModal(): void {
    this.showReponseModal = true;

    if (this.demande?.reponse) {
      this.reponseForm.patchValue({
        reponse: this.demande.reponse.reponse
      });
    }

  }

  /**
   * Fermer le modal de réponse
   */
  closeReponseModal(): void {
    this.showReponseModal = false;
    this.reponseForm.reset();
    this.selectedFiles = [];
  }

  /**
   * Gestion de la sélection des fichiers
   */
  // onFilesSelected(event: any): void {
  //   const files = event.target.files;
  //   if (files) {
  //     this.selectedFiles = Array.from(files);
  //   }
  // }

  /**
   * Soumettre la réponse
   */
  // submitReponse(slug:string): void {
  //   if (this.reponseForm.invalid) {
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append('id_demande', this.demande?.slug || '');
  //   formData.append('reponse', this.reponseForm.value.reponse);
  //   formData.append('id_employe', this.currentEmployeSlug);
  //   // Ajouter les fichiers
  //   this.selectedFiles.forEach((file) => {
  //     formData.append('pieces_jointes[]', file);
  //   });

  //   if(slug){
  //     this.demandeService.updateReponse(slug, formData).subscribe({
  //       next: (res) => {
  //         this.snackBar.open('Réponse mise à jour avec succès', 'Fermer', { duration: 3000 });
  //         this.closeReponseModal();
  //         this.selectedFiles = [];
  //         this.reponseForm.reset();
  //         if (this.demande?.slug) {
  //           this.loadDemandeDetail(this.demande.slug);
  //         }
  //       },
  //       error: (err) => {
  //         this.snackBar.open(
  //           err.error?.message || 'Erreur lors de l’envoi',
  //           'Fermer',
  //           { duration: 4000 }
  //         );
  //       }
  //     });
  //   }else{
  //     this.demandeService.repondre(formData).subscribe({
  //       next: (res) => {
  //         this.snackBar.open('Réponse envoyée avec succès', 'Fermer', { duration: 3000 });

  //         this.closeReponseModal();
  //         this.selectedFiles = [];
  //         this.reponseForm.reset();
  //         if (this.demande?.slug) {
  //           this.loadDemandeDetail(this.demande.slug);
  //         }
  //       },
  //       error: (err) => {
  //         this.snackBar.open(
  //           err.error?.message || 'Erreur lors de l’envoi',
  //           'Fermer',
  //           { duration: 4000 }
  //         );
  //       }
  //     });
  //   }

  // }

  submitReponse(): void {
    if (this.reponseForm.invalid || !this.demande) {
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('id_demande', this.demande.slug);
    formData.append('reponse', this.reponseForm.value.reponse);
    formData.append('id_employe', this.currentEmployeSlug);

    // Pièces jointes
    this.selectedFiles.forEach(file => {
      formData.append('pieces_jointes[]', file);
    });

    // 🔹 Vérifier si une réponse existe déjà
    if (this.demande.reponse?.slug) {
      this.updateReponse(this.demande.reponse.slug, formData);
    } else {
      this.createReponse(formData);
    }
  }


  private createReponse(formData: FormData): void {
    this.demandeService.repondre(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Réponse envoyée avec succès', 'Fermer', {
          duration: 3000
        });

        this.afterSubmit();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de l’envoi',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }
  private updateReponse(slug: string, formData: FormData): void {
    this.demandeService.updateReponse(slug, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Réponse mise à jour avec succès', 'Fermer', {
          duration: 3000
        });

        this.afterSubmit();
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la modification',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

  private afterSubmit(): void {
    this.closeReponseModal();
    this.reponseForm.reset();
    this.selectedFiles = [];

    // 🔁 Recharge la demande pour mettre à jour la vue
    this.loadDemandeDetail(this.demande!.slug);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) {
      return;
    }

    const files = Array.from(input.files);

    const total =
      this.existingFilesCount + this.selectedFiles.length + files.length;

    if (total > 3) {
      this.snackBar.open(
        'Vous ne pouvez joindre que 3 fichiers maximum',
        'Fermer',
        { duration: 3000 }
      );
      input.value = '';
      return;
    }

    this.selectedFiles.push(...files);
    input.value = '';
}

  calculerDuree(debut: string, fin: string): string {
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);

    const diffMs = Math.abs(dateFin.getTime() - dateDebut.getTime());

    const totalHeures = Math.floor(diffMs / (1000 * 60 * 60));
    const jours = Math.floor(totalHeures / 24);
    const heures = totalHeures % 24;

    const heuresFormattees = heures.toString().padStart(2, '0');

    return `${jours}j ${heuresFormattees}h`;
  }


  /**
   * Télécharger un fichier
   */
  downloadFile(piece: PieceReponse): void {
    const link = document.createElement('a');
    link.href = piece.chemin;
    link.download = piece.nom_fichier;
    link.click();
  }
  openFile(piece: PieceReponse): void {
    window.open(piece.chemin, '_blank');
  }


  deletePiece(pieceSlug: any, index: number): void {
    if (!confirm('Supprimer ce fichier ?')) {
      return;
    }

    this.isLoading = true;
    this.demandeService.deletePiece(pieceSlug).subscribe({
      next: () => {
        // this.loadDemandeDetail(this.demande.slug);
        this.snackBar.open('Fichier supprimé', 'Fermer', { duration: 3000 });
        this.demande?.reponse?.pieces?.splice(index, 1);
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la suppression',
          'Fermer',
          { duration: 4000 }
        );
        this.isLoading = false;
      }
    });

  }

  get existingFilesCount(): number {
    return this.demande?.reponse?.pieces?.length || 0;
  }
  canUploadMoreFiles(): boolean {
    return this.existingFilesCount + this.selectedFiles.length < 3;
  }

  getTypeSanctionText(type:string):string{
    switch(type){
      case 'avertissement':
        return 'Avertissement'
      case 'blame':
        return 'Blâme'
      case 'mise_a_pied':
        return 'Mise à pied'
      case 'retrogradation':
        return 'Rétrogradation'
      case 'licenciement':
        return 'Licenciement'
      default:
        return 'Inconnu'
    }
  }

}
