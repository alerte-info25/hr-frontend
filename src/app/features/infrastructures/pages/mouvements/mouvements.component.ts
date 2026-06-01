import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../../material.module';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../services/auth.service';
import { InfrasMouvementService } from '../../services/infras-mouvement.service';
import { da } from 'date-fns/locale';
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
export class MouvementsComponent {

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private mouvementSvr = inject(InfrasMouvementService);
  private authSvr = inject(AuthService);

  mouvements = signal<any[]>([]);
  filteredMouvements = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  searchTerm = signal<string>('');
  filterType = signal<string>('all');
  filterStatus = signal<string>('all');
  isDG = signal(false);
  isResponsable = signal(false);
  // Statistiques
  stats = signal({
    total: 0,
    sorties: 0,
    retours: 0,
    reformes: 0,
    enAttente: 0,
    valides: 0
  });

  // Pagination
  currentPage = signal<number>(1);
  itemsPerPage = 10;
  totalPages = signal<number>(1);

  // Action dropdown
  openActionRowId = signal<string | number | null>(null);

  // Modal confirmation
  showConfirmModal = signal<boolean>(false);
  mouvementToValidate = signal<any>(null);

  private refreshInterval: any;

  ngOnInit(): void {
    this.isDG.set(this.authSvr.isDG());
    this.isResponsable.set(this.authSvr.isResponsable())
    this.loadMouvementByRole();
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

  loadMouvementsByBureau(bureauSlug: string){
    this.mouvementSvr.getMouvementByBureau(bureauSlug).subscribe({
      next:(data: any) => {
        this.mouvements.set(data);
        this.applyFilters();
        this.updateStats();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors du chargement des mouvements','Fermer',{duration:4000})
      }
    });
  }

  loadMouvementByRole(){
    if(this.authSvr.isDG()){
      this.loadMouvements()
    }else{
      const bureauSlug = this.authSvr.getCurrentUser()?.employe?.bureau?.slug;
      if(bureauSlug){
        this.loadMouvementsByBureau(bureauSlug)
      }else{
        this.mouvements.set([]);
        this.snackBar.open('Aucun bureau associé à votre compte', 'Fermer', { duration: 3000 })
      }
    }
  }

  applyFilters(): void {
    let filtered = [...this.mouvements()];

    // Filtre par recherche
    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(m =>
        this.getEquipementNom(m).toLowerCase().includes(term) ||
        this.getBureauSourceNom(m).toLowerCase().includes(term) ||
        this.getBureauDestNom(m).toLowerCase().includes(term) ||
        this.getUserNom(m).toLowerCase().includes(term) ||
        m.motif?.toLowerCase().includes(term)
      );
    }

    // Filtre par type
    if (this.filterType() !== 'all') {
      filtered = filtered.filter(m => m.type === this.filterType());
    }

    // Filtre par statut validation
    if (this.filterStatus() !== 'all') {
      const isValide = this.filterStatus() === 'valide';
      filtered = filtered.filter(m => (m.valider === 1) === isValide);
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
    this.stats.set({
      total: mouvs.length,
      sorties: mouvs.filter(m => m.type === 'sortie_terrain').length,
      retours: mouvs.filter(m => m.type === 'retour_terrain').length,
      reformes: mouvs.filter(m => m.type === 'reforme').length,
      enAttente: mouvs.filter(m => m.valider === 0).length,
      valides: mouvs.filter(m => m.valider === 1).length
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

  onStatusChange(): void {
    this.currentPage.set(1);
    this.applyFilters();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.filterType.set('all');
    this.filterStatus.set('all');
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
    const dialogRef = this.dialog.open(DetailsMvtEquipementComponent, {
      data: mouvement,
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false,
      width: '600px',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe(() => {
      // this.loadMouvementByRole();
    });
  }

  openValidateModal(mouvement: any): void {
    this.mouvementToValidate.set(mouvement);
    this.showConfirmModal.set(true);
  }

  confirmValidate(): void {
    if (!this.mouvementToValidate()) return;
    this.isLoading.set(true);
    const data = {
      valideur: this.authSvr.getCurrentUser()?.employe?.slug
    };
    this.mouvementSvr.valider(data,this.mouvementToValidate().slug).subscribe({
      next: () => {
        this.closeModal();
        this.loadMouvementByRole();
        this.snackBar.open('Mouvement validé avec succès ✅', 'Fermer', { duration: 3000 });
      },
      error: () => {
        this.closeModal();
        this.isLoading.set(false);
        this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
      }
    });
  }

  closeModal(): void {
    this.showConfirmModal.set(false);
    this.mouvementToValidate.set(null);
  }

  // Méthodes utilitaires
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'sortie_terrain': 'logout',
      'retour_terrain': 'login',
      'transfert': 'swap_horiz',
      'mise_en_maintenance': 'build',
      'reforme': 'delete_forever'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'sortie_terrain': 'Sortie',
      'retour_terrain': 'Retour',
      'transfert': 'Transfert',
      'mise_en_maintenance': 'Maintenance',
      'reforme': 'Hors service'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'sortie_terrain': 'type-sortie',
      'retour_terrain': 'type-retour',
      'transfert': 'type-transfert',
      'mise_en_maintenance': 'type-maintenance',
      'reforme': 'type-reforme'
    };
    return classes[type] || '';
  }

  getDestinationDisplay(mouvement: any): string {
    switch (mouvement.type) {
      case 'sortie_terrain':
        // Pour une sortie, on affiche la destination libre
        return mouvement.destination_libre || 'Non précisée';

      case 'retour_terrain':
        const bureaudest = mouvement.bureau_dest?.acronyme ||  'Bureau inconnu';
        const zonedes = mouvement.zone_dest.nom || '_';
        return zonedes ? `${bureaudest} - ${zonedes}` : bureaudest;

      case 'reforme':
        // Pour un retour ou une réforme, on affiche bureau + zone de destination
        const bureau = mouvement.bureau_dest?.acronyme || 'Bureau inconnu';
        const zone = mouvement.zone_dest?.nom || '_';
        return zone ? `${bureau} - ${zone}` : bureau;

      default:
        // Pour les autres types (maintenance, transfert...)
        return mouvement.bureau_dest?.acronyme || mouvement.destination_libre || 'N/A';
    }
  }

  /**
   * Retourne le nom du validateur si le mouvement est validé
   */
  getValidateurNom(mouvement: any): string {
    if (mouvement.valider !== 1) return '';
    return mouvement?.valideur.nom_complet || 'Validateur';
  }

  getEquipementNom(mouvement: any): string {
    return mouvement.equipement?.designation || mouvement.equipement?.nom || 'N/A';
  }

  getBureauSourceNom(mouvement: any): string {
    return mouvement.bureau_source?.nom || mouvement.bureau_source_nom || 'N/A';
  }

  getBureauDestNom(mouvement: any): string {
    return mouvement.destination_libre || mouvement.bureau?.acronyme || 'N/A';
  }

  getZoneSourceNom(mouvement: any): string {
    if(mouvement.type == 'sortie_terrain'){
      return mouvement.destination_libre
    }else if(mouvement.type == 'retour_terrain'){
      return mouvement?.zone_source.nom || '_'
    }else if(mouvement.type == 'reforme'){
      return mouvement?.zone_source.nom || '_'
    }else{
      return 'N/A'
    }
  }

  getZoneDestNom(mouvement: any): string {
    return mouvement.zone_dest?.nom || mouvement.zone_dest_nom || 'N/A';
  }

  getUserNom(mouvement: any): string {
    return mouvement.user?.nom_complet || 'N/A';
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

  canValidate(mouvement: any): boolean {
    return mouvement.valider === 0;
  }

  refresh(): void {
    this.loadMouvementByRole();
  }
}
