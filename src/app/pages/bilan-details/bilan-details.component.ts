import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { MaterialModule } from '../../../../material.module';
import { Router, ActivatedRoute } from '@angular/router';
import { BilanService } from '../../services/bilan.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PdfExportService } from '../../services/PDF/pdf-export.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { LoadingComponent } from '../loading/loading.component';
import { Location } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-bilan-details',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './bilan-details.component.html',
  styleUrl: './bilan-details.component.scss',
  animations: [
    trigger('pageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('0.5s cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('sectionAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-30px)' }),
          stagger(150, [
            animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('cardHover', [
      state('normal', style({ transform: 'scale(1)' })),
      state('hovered', style({ transform: 'scale(1.02)' })),
      transition('normal <=> hovered', animate('0.3s cubic-bezier(0.4, 0, 0.2, 1)'))
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('0.5s 0.2s cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.4s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class BilanDetailsComponent implements OnInit, OnDestroy {
  bilan: any = null;
  detailClean: any = null;
  loading = true;
  bilanSlug: string | null = null;
  activeTab = 'overview';
  hoveredCard: number | null = null;

  // Propriétés pour l'expansion des détails
  expandedDetails: Set<string> = new Set();
  sanitizedCache: Map<string, SafeHtml> = new Map();

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private bilanSvr: BilanService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private pdfExportService: PdfExportService,
    private location: Location
  ) { }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.bilanSlug = params.get('slug');
        if (this.bilanSlug) {
          this.loadBilanDetails(this.bilanSlug);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBilanDetails(slug: string): void {
    // console.log('🔵 Début chargement');
    this.loading = true;
    // console.log('Bilan load begin')
    this.bilanSvr.getBilanBySlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.bilan = data;

          // Filtrer les détails pour l'affichage dans l'onglet Overview
          this.detailClean = this.bilan.details.filter((detail: any) => {
            // Clés à exclure
            const excludedKeys = [
              'prospections',
              'suivis_dossiers',
              'recouvrements',
              'resultats_perspectives',
              'articles',
              'course',
              'courses',
              'rh_activites',
              'admin_activites'
            ];

            // Mois de l'année
            const moisAnnee = [
              'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
              'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
            ];

            // INCLURE rh_activites et admin_activites explicitement
            if (detail.cle === 'rh_activites' || detail.cle === 'admin_activites') {
              return true;
            }

            return !excludedKeys.includes(detail.cle) && !moisAnnee.includes(detail.cle);
          });

          this.loading = false;
          // console.log('📊 Détails transformés:', this.bilan.details);
          // console.log('📊 DetailClean:', this.detailClean);
        },
        error: (err) => {
          console.error('❌ Error:', err);
          this.loading = false;
          this.snackBar.open(err.error.message || 'Erreur lors du chargement du bilan', 'Fermer', { duration: 4000 });
        }
      });
  }
  toggleDetailExpansion(slug: string): void {
    if (this.expandedDetails.has(slug)) {
      this.expandedDetails.delete(slug);
    } else {
      this.expandedDetails.add(slug);
    }
  }

  isDetailExpanded(slug: string): boolean {
    return this.expandedDetails.has(slug);
  }

  /**
   * Charge et sanitize le contenu HTML d'un détail
   */
  loadHtmlContent(detail: any): void {
    const slug = detail.slug;

    // Si déjà dans le cache, on expand juste
    if (this.sanitizedCache.has(slug)) {
      this.expandedDetails.add(slug);
      return;
    }

    // Utiliser setTimeout pour éviter de bloquer le thread principal
    setTimeout(() => {
      const sanitized = this.sanitizer.bypassSecurityTrustHtml(detail.valeur);
      this.sanitizedCache.set(slug, sanitized);
      this.expandedDetails.add(slug);
    }, 0);
  }

  /**
   * Récupère le contenu HTML sanitizé depuis le cache
   */
  getSanitizedContent(detail: any): SafeHtml {
    const slug = detail.slug;

    // Si déjà dans le cache, retourner
    if (this.sanitizedCache.has(slug)) {
      return this.sanitizedCache.get(slug)!;
    }

    // Sinon, sanitizer et mettre en cache
    const sanitized = this.sanitizer.bypassSecurityTrustHtml(detail.valeur);
    this.sanitizedCache.set(slug, sanitized);
    return sanitized;
  }

  /**
   * Extrait un aperçu du texte HTML (supprime les balises)
   */
  getPreviewText(html: string, maxLength: number = 100): string {
    if (!html) return '';

    // Créer un élément temporaire pour extraire le texte
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';

    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Scrolle jusqu'à un détail spécifique dans l'onglet détails
   */
  scrollToDetail(slug: string): void {
    this.setActiveTab('details');
    setTimeout(() => {
      const element = document.querySelector(`[data-detail-slug="${slug}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // ==================== MÉTHODES DE DÉTECTION ====================

  /**
   * Vérifie si le détail est une activité RH ou Admin
   */
  isRhAdminDetail(detail: any): boolean {
    return detail.cle === 'rh_activites' || detail.cle === 'admin_activites';
  }

  isJournalistDetail(valeur: any): boolean {
    return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur) && valeur.nombre !== undefined;
  }

  isCourierDetail(detail: any): boolean {
    return (detail.cle === 'courses' || detail.cle === 'course') && Array.isArray(detail.valeur) && detail.valeur.length > 0;
  }

  isArticlesDetail(detail: any): boolean {
    return detail.cle === 'articles' && Array.isArray(detail.valeur) && detail.valeur.length > 0;
  }

  isSimpleDetail(detail: any): boolean {
    // Exclure les activités RH et Admin de simple detail
    if (this.isRhAdminDetail(detail)) return false;

    return !this.isArticlesDetail(detail) &&
      !this.isProjetsDetail(detail.valeur) &&
      !this.isCourierDetail(detail) &&
      (typeof detail.valeur === 'number' || typeof detail.valeur === 'string');
  }

  isProjetsDetail(valeur: any): boolean {
    return Array.isArray(valeur) && valeur.length > 0 && valeur[0]?.nom !== undefined;
  }

  isHtmlString(valeur: any): boolean {
    return typeof valeur === 'string' && valeur.includes('<');
  }

  isNumber(valeur: any): boolean {
    return typeof valeur === 'number';
  }

  isString(valeur: any): boolean {
    return typeof valeur === 'string';
  }

  // ==================== STATISTIQUES ====================

  getCourierStats(detail: any): { totalDays: number } {
    if (!this.isCourierDetail(detail)) return { totalDays: 0 };
    return { totalDays: detail.valeur.length };
  }

  getStatistics(): any {
    if (!this.bilan || !this.bilan.details) return { total: 0, completed: 0, inProgress: 0 };

    let total = 0;
    let completed = 0;
    let inProgress = 0;

    this.bilan.details.forEach((detail: any) => {
      if (this.isJournalistDetail(detail.valeur)) {
        total += detail.valeur.nombre;
      } else if (this.isProjetsDetail(detail.valeur)) {
        detail.valeur.forEach((projet: any) => {
          total++;
          if (projet.statut === 'termine') completed++;
          else inProgress++;
        });
      }
    });

    return { total, completed, inProgress };
  }

  // ==================== UTILITAIRES ====================

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  getTrimestreLabel(trimestre: number): string {
    const labels = ['', 'Premier Trimestre', 'Deuxième Trimestre', 'Troisième Trimestre', 'Quatrième Trimestre'];
    return labels[trimestre] || 'Trimestre';
  }

  getTrimestreShortLabel(trimestre: number): string {
    const labels = ['', 'T1', 'T2', 'T3', 'T4'];
    return labels[trimestre] || 'T?';
  }

  getTrimestreColor(trimestre: number): string {
    const colors = ['', '#667eea', '#f59e0b', '#ef4444', '#10b981'];
    return colors[trimestre] || '#667eea';
  }

  getDetailIcon(cle: string): string {
    const icons: { [key: string]: string } = {
      'articles': 'link',
      'interviews': 'mic',
      'reportages': 'camera_alt',
      'videos': 'videocam',
      'prospections': 'trending_up',
      'nombre_clients': 'person_add',
      'chiffre_affaire': 'attach_money',
      'suivis_dossiers': 'assignment',
      'recouvrements': 'payments',
      'resultats_perspectives': 'insights',
      'projets': 'code',
      'rh_activites': 'people_outline',
      'admin_activites': 'apartment'
    };
    return icons[cle] || 'description';
  }

  getDetailLabel(cle: string): string {
    const labels: { [key: string]: string } = {
      'articles': 'Liens des articles',
      'interviews': 'Interviews réalisées',
      'reportages': 'Reportages',
      'videos': 'Vidéos produites',
      'prospections': 'Activités de prospection',
      'nombre_clients': 'Nouveaux clients',
      'chiffre_affaire': 'Chiffre d\'affaires',
      'suivis_dossiers': 'Suivis de dossiers',
      'recouvrements': 'Recouvrements',
      'resultats_perspectives': 'Résultats & Perspectives',
      'projets': 'Projets développés',
      'rh_activites': 'Activités Ressources Humaines',
      'admin_activites': 'Activités Administratives'
    };
    return labels[cle] || cle;
  }

  // ==================== NAVIGATION ET ACTIONS ====================

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onCardHover(index: number): void {
    this.hoveredCard = index;
  }

  onCardLeave(): void {
    this.hoveredCard = null;
  }

  shareBilan(): void {
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: 'Bilan trimestriel',
        text: 'Consulter le bilan trimestriel',
        url
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.snackBar.open('Lien copié', 'OK', { duration: 3000 });
      });
    }
  }

  editBilan(): void {
    this.router.navigate(['/edit-bilan', this.bilan.slug]);
  }

  goBack(): void {
    this.location.back();
  }

  printBilan(): void {
    window.print();
  }

  async exportPDF(): Promise<void> {
    if (!this.bilan) {
      this.snackBar.open('Aucun bilan à exporter', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const snackBarRef = this.snackBar.open('Génération du PDF en cours...', undefined, {
        duration: undefined
      });

      await this.pdfExportService.exportBilan(this.bilan);

      snackBarRef.dismiss();
      this.snackBar.open('PDF généré avec succès !', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      this.snackBar.open('Erreur lors de la génération du PDF', 'Fermer', { duration: 4000 });
    }
  }
}
