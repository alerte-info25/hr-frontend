import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../../material.module';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../services/auth.service';
import { InfrasMouvementService } from '../../services/infras-mouvement.service';
import { DetailsMvtEquipementComponent } from '../dialog/details-mvt-equipement/details-mvt-equipement.component';

@Component({
  selector: 'app-mouvements',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './mouvements.component.html',
  styleUrl: './mouvements.component.scss',
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
export class MouvementsComponent implements OnInit, OnDestroy {

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private mouvementSvr = inject(InfrasMouvementService);
  private authSvr = inject(AuthService);

  mouvements = signal<any[]>([]);
  filteredMouvements = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');
  filterType = signal<string>('all');
  filterPeriod = signal<string>('all'); // Nouveau filtre par période
  isAdmin = signal<boolean>(false);

  // Statistiques
  stats = signal({
    total: 0,
    sorties: 0,
    retours: 0,
    reformes: 0,
    aujourdhui: 0,
    cetteSemaine: 0,
    ceMois: 0
  });

  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = 10;
  totalPages = signal<number>(1);

  // Action dropdown
  openActionRowId = signal<string | number | null>(null);

  private refreshInterval: any;

  ngOnInit(): void {
    this.isAdmin.set(this.authSvr.isDG() || this.authSvr.isResponsable());
    this.loadMouvements();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadMouvements(showLoading: boolean = true): void {
    if (showLoading) this.isLoading.set(true);

    this.mouvementSvr.getAll().subscribe({
      next: (data: any) => {
        this.mouvements.set(data);
        this.applyFilters();
        this.updateStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement mouvements:', err);
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des mouvements', 'Fermer', { duration: 3000 });
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.mouvements()];

    // Filtre par recherche
    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(m =>
        this.getEquipementNom(m).toLowerCase().includes(term) ||
        this.getEmployeNom(m).toLowerCase().includes(term) ||
        this.getDestinationDisplay(m).toLowerCase().includes(term) ||
        m.motif?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (this.filterType() !== 'all') {
      filtered = filtered.filter(m => m.type === this.filterType());
    }

    // Filtre par période
    if (this.filterPeriod() !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(m => {
        const date = new Date(m.date_mouvement);
        switch (this.filterPeriod()) {
          case 'today':
            return date >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return date >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Tri par date (plus récent d'abord)
    filtered.sort((a, b) => new Date(b.date_mouvement).getTime() - new Date(a.date_mouvement).getTime());

    // Pagination
    this.totalPages.set(Math.ceil(filtered.length / this.itemsPerPage));
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    this.filteredMouvements.set(filtered.slice(start, start + this.itemsPerPage));
  }

  updateStats(): void {
    const mouvs = this.mouvements();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    this.stats.set({
      total: mouvs.length,
      sorties: mouvs.filter(m => m.type === 'sortie_terrain').length,
      retours: mouvs.filter(m => m.type === 'retour_terrain').length,
      reformes: mouvs.filter(m => m.type === 'reforme').length,
      aujourdhui: mouvs.filter(m => new Date(m.date_mouvement) >= today).length,
      cetteSemaine: mouvs.filter(m => new Date(m.date_mouvement) >= weekAgo).length,
      ceMois: mouvs.filter(m => new Date(m.date_mouvement) >= monthAgo).length
    });
  }

  onSearchChange(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  onTypeChange(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  onPeriodChange(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.filterType.set('all');
    this.filterPeriod.set('all');
    this.currentPage.set(1);
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applyFilters();
    }
  }

  toggleActions(event: Event, id: string | number): void {
    event.stopPropagation();
    if (this.openActionRowId() === id) {
      this.openActionRowId.set(null);
    } else {
      this.openActionRowId.set(id);
    }
  }

  openDetails(mouvement: any): void {
    this.dialog.open(DetailsMvtEquipementComponent, {
      data: mouvement,
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false,
      width: '600px',
      maxWidth: '90vw'
    });
  }

  // Méthodes utilitaires
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'sortie_terrain': 'logout',
      'retour_terrain': 'login',
      'reforme': 'delete_forever'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'sortie_terrain': 'Sortie terrain',
      'retour_terrain': 'Retour terrain',
      'reforme': 'Hors service'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'sortie_terrain': 'type-sortie',
      'retour_terrain': 'type-retour',
      'reforme': 'type-reforme'
    };
    return classes[type] || '';
  }

  getDestinationDisplay(mouvement: any): string {
    switch (mouvement.type) {
      case 'sortie_terrain':
        return mouvement.destination_libre || 'Non précisée';

      case 'retour_terrain':
        const bureauRetour = mouvement.bureau_dest?.acronyme || 'Bureau inconnu';
        const zoneRetour = mouvement.zone_dest?.nom || '';
        return zoneRetour ? `${bureauRetour} - ${zoneRetour}` : bureauRetour;

      case 'reforme':
        const bureauReforme = mouvement.bureau_dest?.acronyme || 'Bureau inconnu';
        const zoneReforme = mouvement.zone_dest?.nom || '';
        return zoneReforme ? `${bureauReforme} - ${zoneReforme}` : bureauReforme;

      default:
        return mouvement.bureau_dest?.acronyme || mouvement.destination_libre || 'N/A';
    }
  }

  getEquipementNom(mouvement: any): string {
    return mouvement.equipement?.designation || 'N/A';
  }


  getEquipementCode(mouvement: any): string {
    return mouvement.equipement?.code_interne || 'N/A';
  }

  getEmployeNom(mouvement: any): string {
    return mouvement.user?.nom_complet || 'N/A';
  }

  getAdminNom(mouvement: any): string {
    return mouvement.valideur?.nom_complet || 'N/A';
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
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

  getStatusLabel(mouvement: any): string {
    return 'Effectué';
  }

  getStatusClass(mouvement: any): string {
    return 'status-effectue';
  }

  getStatusIcon(mouvement: any): string {
    return 'check_circle';
  }

  refresh(): void {
    this.loadMouvements();
  }
}
