import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MaterialModule } from '../../../../material.module';
import { Router, RouterLink } from '@angular/router';
import { BilanService } from '../../services/bilan.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-bilan-employe',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './bilan-employe.component.html',
  styleUrl: './bilan-employe.component.scss',
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.5s cubic-bezier(0.35, 0, 0.25, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('expandAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('0.4s cubic-bezier(0.35, 0, 0.25, 1)',
          style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('0.3s cubic-bezier(0.35, 0, 0.25, 1)',
          style({ height: 0, opacity: 0 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class BilanEmployeComponent implements OnInit {
  bilans: any[] = [];
  loading = true;
  selectedBilan: any | null = null;
  user: any;
  isLoading: boolean = false;
  // Filtre
  selectedYear: number | null = null;
  selectedTrimestre: number | '' = '';
  filteredBilans: any[] = [];
  availableYears: number[] = [];

  // Clés spécifiques par service
  private readonly serviceKeys: { [key: string]: string[] } = {
    'journaliste': ['articles', 'interviews', 'reportages', 'videos'],
    'commercial': ['prospection', 'nouveaux_clients', 'chiffre_affaire', 'resultats_perspectives'],
    'developpeur': ['projets']
  };
  courseDisplayedColumns: string[] = [
    'date',
    'heure_arrive',
    'heure_depart',
    'tache_effectuer',
    'lieu',
    'observation'
  ];



  constructor(
    private router: Router,
    private bilanSvr: BilanService,
    private snackBar: MatSnackBar,
    private authSvr: AuthService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    this.loadBilans();
  }

  loadBilans(): void {
    this.loading = true;

    this.bilanSvr.getBilanByEmp(this.user?.employe.slug).subscribe({
      next: (data) => {
        this.bilans = data.map((bilan: any) => ({
          ...bilan,
          previewDetails: bilan.details?.slice(0, 3) || []
        }));
        // Les années disponibles
        const yearsSet = new Set(this.bilans.map(b => b.annee));
        this.availableYears = Array.from(yearsSet).sort((a, b) => b - a);

        // Filtre initial
        this.filteredBilans = [...this.bilans];

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error.message || 'Erreur lors de la récupération de vos bilans',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

  applyFilters(): void {
    this.filteredBilans = this.bilans.filter(b => {
      const matchesYear = this.selectedYear ? b.annee === this.selectedYear : true;
      const matchesTrimestre = this.selectedTrimestre ? b.trimestre === this.selectedTrimestre : true;
      return matchesYear && matchesTrimestre;
    });
  }

  resetFilters(): void {
    this.selectedYear = null;
    this.selectedTrimestre = '';
    this.filteredBilans = [...this.bilans];
  }



  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  toggleExpand(bilan: any): void {
    bilan.expanded = !bilan.expanded;
  }

  getTrimestreLabel(trimestre: number): string {
    const labels = ['', 'T1', 'T2', 'T3', 'T4'];
    return labels[trimestre] || 'T?';
  }

  getTrimestreColor(trimestre: number): string {
    const colors = ['', 'primary', 'accent', 'warn', 'primary'];
    return colors[trimestre] || 'primary';
  }

  getDetailIcon(cle: string): string {
    const icons: { [key: string]: string } = {
      'articles': 'link',
      'interviews': 'mic',
      'reportages': 'camera_alt',
      'videos': 'videocam',
      'prospection': 'trending_up',
      'nouveaux_clients': 'person_add',
      'chiffre_affaire': 'euro',
      'resultats_perspectives': 'insights',
      'projets': 'code'
    };
    return icons[cle] || 'description';
  }

  getDetailLabel(cle: string): string {
    const labels: { [key: string]: string } = {
      'articles': 'Liens',
      'interviews': 'Interviews',
      'reportages': 'Reportages',
      'videos': 'Vidéos',
      'prospection': 'Prospection',
      'nouveaux_clients': 'Nouveaux clients',
      'chiffre_affaire': 'Chiffre d\'affaires',
      'resultats_perspectives': 'Résultats & Perspectives',
      'projets': 'Projets'
    };
    return labels[cle] || cle;
  }

  formatValeur(valeur: any): string {
    if (typeof valeur === 'number') {
      return valeur.toString();
    }
    if (typeof valeur === 'object' && valeur.nombre !== undefined) {
      return `${valeur.nombre} élément(s)`;
    }
    if (Array.isArray(valeur)) {
      return `${valeur.length} projet(s)`;
    }
    return 'Voir détails';
  }

  isArray(valeur: any): boolean {
    return Array.isArray(valeur);
  }

  isObject(valeur: any): boolean {
    return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur);
  }

  isNumber(valeur: any): boolean {
    return typeof valeur === 'number';
  }

  isString(valeur: any): boolean {
    return typeof valeur === 'string';
  }

  isHtmlString(valeur: any): boolean {
    return typeof valeur === 'string' && valeur.includes('<');
  }

  // Vérifie si un détail est un objet avec nombre et liens (pour journalistes)
  isJournalistDetail(valeur: any): boolean {
    return this.isObject(valeur) && valeur.nombre !== undefined;
  }

  // Vérifie si un détail est un tableau de projets (pour développeurs)
  isProjetsDetail(valeur: any): boolean {
    return this.isArray(valeur) && valeur.length > 0 && valeur[0]?.nom !== undefined;
  }

  editBilan(bilan: any): void {
    this.router.navigate(['/edit-bilan', bilan.slug]);
  }

  getStatusClass(bilan: any): string {
    const now = new Date();
    const bilanDate = new Date(bilan.updated_at);
    const daysDiff = Math.floor((now.getTime() - bilanDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 7) return 'recent';
    if (daysDiff < 30) return 'normal';
    return 'old';
  }

  goToAdd(): void {
    this.router.navigate(['/add-bilan']);
  }

  goToDetails(bilan:any): void {
    this.router.navigate(['/bilan-details', bilan.slug]);
  }

}
