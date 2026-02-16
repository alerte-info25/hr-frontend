import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BilanService } from '../../services/bilan.service';
import { MaterialModule } from '../../../../material.module';
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PdfExportService } from '../../services/PDF/pdf-export.service';
interface BilanComplet {
  bilan: {
    slug: string;
    trimestre: number;
    annee: number;
    introduction: string;
    commentaire: string;
    created_at: string;
    updated_at: string;
  };
  employe: {
    slug: string;
    nom: string;
    prenom: string;
    email: string;
    matricule: string;
  };
  service: {
    slug: string;
    nom: string;
    code: string;
  }| null;
  details: any;
  historique: any[];
  statistiques: {
    nombre_total_modifications: number;
    derniere_modification: string;
    premiere_modification: string;
    champs_modifies: string[];
    types_modifications: any;
  };
}
@Component({
  selector: 'app-details-bilan',
  imports: [MaterialModule, CommonModule],
  templateUrl: './details-bilan.component.html',
  styleUrl: './details-bilan.component.scss'
})
export class DetailsBilanComponent {
  bilanData: BilanComplet | null = null;
  isLoading = true;
  errorMessage = '';
  selectedTabIndex = 0;

  displayedColumnsCoursier: string[] = [
    'index',
    'date',
    'heure_arrive',
    'heure_depart',
    'tache',
    'lieu',
    'observation'
  ];
  courseCols = ['date', 'depart', 'arrivee', 'tache','lieu', 'observation'];
  projectCols = ['nom', 'statut', 'taches'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bilanService: BilanService,
    private location: Location,
    private snackBar: MatSnackBar,
    private pdfExportService: PdfExportService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadBilanDetails(slug);
    } else {
      this.errorMessage = 'Identifiant du bilan manquant';
      this.isLoading = false;
    }
  }

  loadBilanDetails(slug: string): void {
    this.isLoading = true;
    // Adapter selon votre endpoint - vous devrez peut-être ajouter cette méthode au service
    this.bilanService.getBilanDetails(slug).subscribe({
      next: (response) => {
        if (response.success) {
          this.bilanData = response.data;
        } else {
          this.errorMessage = response.message || 'Erreur lors du chargement';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        this.errorMessage = 'Impossible de charger les détails du bilan';
        this.isLoading = false;
      }
    });
  }

  getTrimestreLabel(trimestre: number): string {
    const labels = ['', '1er Trimestre', '2ème Trimestre', '3ème Trimestre', '4ème Trimestre'];
    return labels[trimestre] || `Trimestre ${trimestre}`;
  }

  getMoisTrimestre(trimestre: number): string {
    const mois = [
      '',
      'Janvier - Février - Mars',
      'Avril - Mai - Juin',
      'Juillet - Août - Septembre',
      'Octobre - Novembre - Décembre'
    ];
    return mois[trimestre] || '';
  }

  getServiceIcon(): string {
    const type = this.getServiceType();
    const icons: { [key: string]: string } = {
      'journ': 'article',
      'com': 'business_center',
      'dev': 'code',
      'compta': 'account_balance',
      'coursier': 'two_wheeler'
    };
    return icons[type] || 'work';
  }

  getServiceType(): string {
    if (!this.bilanData?.details) return 'unknown';

    const details = this.bilanData.details;

    // Détection basée sur les clés présentes
    if (details.courses) return 'coursier';
    if (details.projets) return 'dev';
    if (details.articles || details.nombre_articles) return 'journ';
    if (details.prospections || details.suivis_dossiers) return 'com';
    if (details.activites_mensuelles) return 'compta';

    return 'unknown';
  }

  getModificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'create': 'add_circle',
      'update': 'edit',
      'delete': 'delete'
    };
    return icons[type] || 'change_circle';
  }

  getModificationColor(type: string): 'primary' | 'accent' | 'warn' {
    const colors: any = {
      create: 'primary',
      update: 'accent',
      delete: 'warn'
    };

    return colors[type] || 'accent';
  }

  getFrenchTextForType(type: string): string {
    const types: { [key: string]: string } = {
      'create': 'Ajouter',
      'update': 'Modifier',
      'delete': 'Supprimer'
    };
    return types[type] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCourseDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  isObject(value: any): boolean {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  isString(value: any): boolean {
    return typeof value === 'string';
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  retour(): void {
    // this.router.navigate(['/bilans']);
    this.location.back();
  }

  editer(): void {
    if (this.bilanData) {
      this.router.navigate(['/bilans/edit', this.bilanData.bilan.slug]);
    }
  }

  imprimer(): void {
    window.print();
  }

  // Méthode helper pour vérifier si l'historique existe
  hasHistorique(): boolean {
    return !!(this.bilanData?.historique && this.bilanData.historique.length > 0);
  }
  hasDetail(key: string): boolean {
    return this.bilanData?.details && this.bilanData.details[key] !== undefined && this.bilanData.details[key] !== null;
  }

  // Méthode helper pour obtenir la longueur de l'historique de manière sécurisée
  getHistoriqueLength(): number {
    return this.bilanData?.historique?.length || 0;
  }

  compareValues(ancienne: any, nouvelle: any): { added: boolean; removed: boolean; modified: boolean } {
    return {
      added: !ancienne && nouvelle,
      removed: ancienne && !nouvelle,
      modified: ancienne && nouvelle && ancienne !== nouvelle
    };
  }

  stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  truncateText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    const stripped = this.stripHtml(text);
    return stripped.length > maxLength
      ? stripped.substring(0, maxLength) + '...'
      : stripped;
  }

  async exportPDF(): Promise<void> {
    if (!this.bilanData) {
      this.snackBar.open('Aucun bilan à exporter', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const snackBarRef = this.snackBar.open('Génération du PDF en cours...', undefined, {
        duration: undefined
      });

      await this.pdfExportService.exportBilan(this.bilanData);

      snackBarRef.dismiss();
      this.snackBar.open('PDF généré avec succès !', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.snackBar.open('Erreur lors de la génération du PDF', 'Fermer', { duration: 4000 });
    }
  }


}
