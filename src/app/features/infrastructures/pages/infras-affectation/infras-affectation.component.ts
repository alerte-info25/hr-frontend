import { Component, OnInit, OnDestroy } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../../material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InfrasAffectationService } from '../../services/infras-affectation.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../services/auth.service';
import { BureauxService } from '../../services/bureaux.service';
import { ZonesService } from '../../services/zones.service';

@Component({
  selector: 'app-infras-affectation',
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule],
  templateUrl: './infras-affectation.component.html',
  styleUrl: './infras-affectation.component.scss',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ]),
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class InfrasAffectationComponent implements OnInit, OnDestroy {

  affectations: any[] = [];
  filteredAffectations: any[] = [];
  isLoading = true;
  searchTerm = '';
  filterStatut = 'all';
  isDG = false;
  // Nouveaux filtres
  bureaux: any[] = [];
  zones: any[] = [];
  selectedBureau: string = '';
  selectedZone: string = '';

  // Statistiques
  stats = {
    total: 0,
    actives: 0,
    retournees: 0,
    transferees: 0
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  // modal details
  showDetailsModal: boolean = false;
  selectedAffectation: any = null;

  private refreshInterval: any;

  constructor(
    private affectationSvr: InfrasAffectationService,
    private snackBar: MatSnackBar,
    private authSvr: AuthService,
    private bureauSvr: BureauxService,
    private zoneSvr: ZonesService
  ) {}

  ngOnInit(): void {
    this.loadAffectationsByRole();
    this.loadZonesByRole();
    if (this.authSvr.isDG()) {
      this.isDG = true;
      this.loadBureaux();
    }
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.body.style.overflow = '';
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  loadAffectationsByRole(showLoading: boolean = true): void {
    if (showLoading) this.isLoading = true;

    if (this.authSvr.isDG()) {
      this.loadAffectations();
    } else {
      const bureauSlug = this.authSvr.getCurrentUser()?.employe?.bureau?.slug;
      if (bureauSlug) {
        this.selectedBureau = bureauSlug; // Pré-sélectionner le bureau de l'utilisateur
        this.loadAffectationsByBureau(bureauSlug);
      } else {
        this.affectations = [];
        this.filteredAffectations = [];
        this.isLoading = false;
        this.snackBar.open('Aucun bureau associé à votre compte', 'Fermer', { duration: 3000 });
      }
    }
  }

  loadAffectations(): void {
    this.affectationSvr.getAll().subscribe({
      next: (data: any) => {
        this.affectations = data;
        this.applyFilters();
        this.updateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement affectations:', err);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des affectations', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadAffectationsByBureau(bureauSlug: string): void {
    this.affectationSvr.getAffectationByBureau(bureauSlug).subscribe({
      next: (data: any) => {
        this.affectations = data;
        this.applyFilters();
        this.updateStats();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des affectations', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadBureaux(): void {
    this.bureauSvr.getAll().subscribe({
      next: (data: any) => {
        this.bureaux = data;
      },
      error: (err) => {
        console.error('Erreur chargement bureaux:', err);
        this.snackBar.open('Erreur lors du chargement des bureaux', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadZones(): void {
    this.zoneSvr.getAll().subscribe({
      next: (data: any) => {
        this.zones = data;
      },
      error: (err) => {
        console.error('Erreur chargement zones:', err);
        this.snackBar.open('Erreur lors du chargement des zones', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadZonesByBureau(bureauSlug: string): void {
    this.zoneSvr.getZonesByBureau(bureauSlug).subscribe({
      next: (data: any) => {
        this.zones = data;
      },
      error: (err) => {
        console.error('Erreur chargement zones par bureau:', err);
        this.snackBar.open('Erreur lors du chargement des zones', 'Fermer', { duration: 3000 });
      }
    });
  }

  loadZonesByRole(): void {
    if (this.authSvr.isDG()) {
      this.loadZones();
    } else {
      const bureauSlug = this.authSvr.getCurrentUser()?.employe?.bureau?.slug;
      if (bureauSlug) {
        this.loadZonesByBureau(bureauSlug);
      } else {
        this.zones = [];
        this.snackBar.open('Aucun bureau associé à votre compte', 'Fermer', { duration: 3000 });
      }
    }
  }

  // ==================== FILTRES ====================

  applyFilters(): void {
    let filtered = [...this.affectations];

    // Filtre par recherche (équipement, zone, employé, bureau)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        (this.getEquipementNom(a).toLowerCase().includes(term)) ||
        (this.getZoneNom(a).toLowerCase().includes(term)) ||
        (this.getEmployeNom(a).toLowerCase().includes(term)) ||
        (this.getBureauNom(a).toLowerCase().includes(term))
      );
    }

    // Filtre par statut
    if (this.filterStatut !== 'all') {
      filtered = filtered.filter(a => a.statut === this.filterStatut);
    }

    // Filtre par bureau
    if (this.selectedBureau) {
      filtered = filtered.filter(a =>
        a.bureau?.slug === this.selectedBureau ||
        a.bureau_slug === this.selectedBureau
      );
    }

    // Filtre par zone
    if (this.selectedZone) {
      filtered = filtered.filter(a =>
        a.zone?.slug === this.selectedZone ||
        a.zone_slug === this.selectedZone
      );
    }

    // Tri par date d'affectation (plus récent d'abord)
    filtered.sort((a, b) => new Date(b.date_affectation).getTime() - new Date(a.date_affectation).getTime());

    // Pagination
    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage);
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredAffectations = filtered.slice(start, start + this.itemsPerPage);
  }

  // ==================== ÉVÉNEMENTS DES FILTRES ====================

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onBureauChange(): void {
    this.currentPage = 1;
    this.selectedZone = ''; // Reset zone quand on change de bureau

    // Recharger les zones du bureau sélectionné
    if (this.selectedBureau) {
      this.loadZonesByBureau(this.selectedBureau);
    } else if (this.authSvr.isDG()) {
      this.loadZones(); // Si DG et pas de bureau sélectionné, charger toutes les zones
    }

    // Recharger les affectations si nécessaire
    if (!this.authSvr.isDG() && this.selectedBureau) {
      this.isLoading = true;
      this.loadAffectationsByBureau(this.selectedBureau);
    } else {
      this.applyFilters();
    }
  }

  onZoneChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatut = 'all';
    this.selectedBureau = '';
    this.selectedZone = '';
    this.currentPage = 1;

    // Recharger les zones selon le rôle
    if (this.authSvr.isDG()) {
      this.loadZones();
      this.loadAffectations();
    } else {
      const bureauSlug = this.authSvr.getCurrentUser()?.employe?.bureau?.slug;
      if (bureauSlug) {
        this.selectedBureau = bureauSlug;
        this.loadZonesByBureau(bureauSlug);
        this.loadAffectationsByBureau(bureauSlug);
      } else {
        this.applyFilters();
      }
    }
  }

  // ==================== STATISTIQUES ====================

  updateStats(): void {
    this.stats.total = this.affectations.length;
    this.stats.actives = this.affectations.filter(a => a.statut === 'active').length;
    this.stats.transferees = this.affectations.filter(a => a.statut === 'transferee').length;
  }

  // ==================== PAGINATION ====================

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  // ==================== UTILITAIRES AFFICHAGE ====================

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'active': 'statut-active',
      'transferee': 'statut-transferee'
    };
    return classes[statut] || '';
  }

  getStatutIcon(statut: string): string {
    const icons: { [key: string]: string } = {
      'active': 'check_circle',
      'retournee': 'assignment_return',
      'transferee': 'swap_horiz'
    };
    return icons[statut] || 'help';
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'active': 'Active',
      'transferee': 'Transférée'
    };
    return labels[statut] || statut;
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const d = new Date(date);

    const dateStr = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const timeStr = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${dateStr} à ${timeStr}`;
  }

  // Méthodes utilitaires pour le template
  getEquipementNom(affectation: any): string {
    return affectation?.equipement?.designation || 'N/A';
  }

  getZoneNom(affectation: any): string {
    return affectation.zone?.nom || 'N/A';
  }

  getEmployeNom(affectation: any): string {
    return affectation?.user_rh?.nom_complet || 'N/A';
  }

  getBureauNom(affectation: any): string {
    return affectation.bureau?.acronyme || 'N/A';
  }

  getAffecteurNom(affectation: any): string {
    return affectation.affecter_par?.nom_complet || 'N/A'
  }

  refresh(): void {
    this.loadAffectationsByRole();
    this.loadZonesByRole();
    if (this.authSvr.isDG()) {
      this.loadBureaux();
    }
  }

  // Ajoute ces méthodes pour afficher les noms dans les tags de filtres
  getBureauNomBySlug(slug: string): string {
    const bureau = this.bureaux.find(b => b.rh_slug === slug);
    return bureau?.nom;
  }

  getZoneNomBySlug(slug: string): string {
    const zone = this.zones.find(z => z.slug === slug);
    return zone?.nom || slug;
  }

  openDetailsModal(affectation: any): void {
    this.selectedAffectation = affectation;
    this.showDetailsModal = true;
    // Empêcher le scroll du body quand le modal est ouvert
    document.body.style.overflow = 'hidden';
  }

  // Méthode pour fermer le modal
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedAffectation = null;
    // Réactiver le scroll
    document.body.style.overflow = '';
  }

  // Fermer le modal avec la touche Echap
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.showDetailsModal) {
      this.closeDetailsModal();
    }
  }

  exportData(): void {
    const dataToExport = this.filteredAffectations.map(a => ({
      'Équipement': this.getEquipementNom(a),
      'Zone': this.getZoneNom(a),
      'Employé': this.getEmployeNom(a),
      'Bureau': this.getBureauNom(a),
      "Date d'affectation": this.formatDate(a.date_affectation),
      'Date de retour': this.formatDate(a.date_retour),
      'Statut': this.getStatutLabel(a.statut),
      'Motif': a.motif || ''
    }));

    console.log('Export des données:', dataToExport);
    this.snackBar.open('Export démarré', 'Fermer', { duration: 2000 });
  }
}
