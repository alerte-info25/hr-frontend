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

  // ⬇️ AJOUTEZ CES NOUVELLES PROPRIÉTÉS
  expandedDetails: Set<string> = new Set(); // Pour tracker les détails expanded
  sanitizedCache: Map<string, SafeHtml> = new Map(); // Cache pour le HTML sanitizé

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
    console.log('🔄 Component initialized');
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
    console.log('🔄 START loadBilanDetails', slug);
    this.loading = true;

    this.bilanSvr.getBilanBySlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Data received:', data);
          this.bilan = data;
          console.log('🔍 Processing details...');

          this.detailClean = this.bilan.details.filter((detail: any) => {
            console.log('Filtering detail:', detail.cle);
            return detail.cle !== 'prospections' &&
              detail.cle !== 'suivis_dossiers' &&
              detail.cle !== 'recouvrements' &&
              detail.cle !== 'resultats_perspectives' &&
              detail.cle !== 'articles' &&
              detail.cle !== 'course' &&
              detail.cle !== 'courses' &&
              !['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].includes(detail.cle);
          });

          console.log('✅ Details filtered:', this.detailClean);
          this.loading = false;
          console.log('✅ END loadBilanDetails');
        },
        error: (err) => {
          console.error('❌ Error:', err);
          this.loading = false;
          this.snackBar.open(err.error.message || 'Erreur lors du chargement du bilan', 'Fermer', { duration: 4000 });
        }
      });
  }

  // ⬇️ AJOUTEZ CES NOUVELLES MÉTHODES

  /**
   * Toggle l'expansion d'un détail
   */
  toggleDetailExpansion(slug: string): void {
    console.log(`🔄 Toggling expansion for: ${slug}`);
    if (this.expandedDetails.has(slug)) {
      this.expandedDetails.delete(slug);
      console.log(`➖ Collapsed: ${slug}`);
    } else {
      this.expandedDetails.add(slug);
      console.log(`➕ Expanded: ${slug}`);
    }
  }

  /**
   * Vérifie si un détail est expanded
   */
  isDetailExpanded(slug: string): boolean {
    return this.expandedDetails.has(slug);
  }

  /**
   * Charge et sanitize le contenu HTML d'un détail
   */
  loadHtmlContent(detail: any): void {
    const slug = detail.slug;
    console.log(`📄 Loading HTML content for: ${detail.cle} (${slug})`);

    // Si déjà dans le cache, on expand juste
    if (this.sanitizedCache.has(slug)) {
      this.expandedDetails.add(slug);
      console.log(`✅ Using cached content for: ${slug}`);
      return;
    }

    // Utilisez setTimeout pour éviter de bloquer le thread principal
    setTimeout(() => {
      console.log(`🔄 Sanitizing HTML for: ${slug}`);
      const sanitized = this.sanitizer.bypassSecurityTrustHtml(detail.valeur);
      this.sanitizedCache.set(slug, sanitized);
      this.expandedDetails.add(slug);
      console.log(`✅ HTML content loaded and cached for: ${slug}`);
    }, 0);
  }

  /**
   * Récupère le contenu HTML sanitizé depuis le cache
   */
  getSanitizedContent(detail: any): SafeHtml {
    const slug = detail.slug;

    // Si déjà dans le cache, retournez
    if (this.sanitizedCache.has(slug)) {
      return this.sanitizedCache.get(slug)!;
    }

    // Sinon, sanitize et mettez en cache
    console.log(`🔄 First-time sanitizing for: ${slug}`);
    const sanitized = this.sanitizer.bypassSecurityTrustHtml(detail.valeur);
    this.sanitizedCache.set(slug, sanitized);
    return sanitized;
  }

  // ⬆️ FIN DES NOUVELLES MÉTHODES

  // Statistiques rapides pour les coursiers
  getCourierStats(detail: any): { totalDays: number } {
    if (!this.isCourierDetail(detail)) return { totalDays: 0 };
    return { totalDays: detail.valeur.length };
  }

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
      'projets': 'code'
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
      'projets': 'Projets développés'
    };
    return labels[cle] || cle;
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
    return !this.isArticlesDetail(detail) && (typeof detail.valeur === 'number' || typeof detail.valeur === 'string');
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onCardHover(index: number): void {
    this.hoveredCard = index;
  }

  onCardLeave(): void {
    this.hoveredCard = null;
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
