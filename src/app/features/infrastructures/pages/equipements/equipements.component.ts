import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../../../material.module';
import { EquipementsService } from '../../services/equipements.service';
import { FormsDialogComponent } from '../../../../pages/dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDeleteDialogComponent } from '../../../../pages/dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { InfrasLoadingComponent } from '../infras-loading/infras-loading.component';
import { DetailsEquipementComponent } from '../dialog/details-equipement/details-equipement.component';
import { CuEquipementComponent } from '../dialog/cu-equipement/cu-equipement.component';
import { AuthService } from '../../../../services/auth.service';
import { CategoriesService } from '../../services/categories.service';
import { ZonesService } from '../../services/zones.service';
import { AssignEquipementComponent } from '../dialog/assign-equipement/assign-equipement.component';
import { BureauxService } from '../../services/bureaux.service';
import { MvtEquipementComponent } from '../dialog/mvt-equipement/mvt-equipement.component';

@Component({
  selector: 'app-equipements',
  imports: [CommonModule, MaterialModule, FormsModule, ReactiveFormsModule, ConfirmDeleteDialogComponent, InfrasLoadingComponent],
  templateUrl: './equipements.component.html',
  styleUrl: './equipements.component.scss',
})
export class EquipementsComponent implements OnInit {
  // Signals pour l'état réactif
  equipements = signal<any[]>([]);
  isLoading = signal(true);
  showConfirmModal = signal(false);
  itemToDelete = signal<any>(null);

  // Filtres
  search = signal('');
  selectedCategorie = signal('');
  selectedEtat = signal('');
  selectedBureau = signal('');
  selectedZone = signal('');
  sortBy = signal('designation');
  sortOrder = signal<'asc' | 'desc'>('asc');
  isDG = signal(false);
  isResponsable = signal(false);
  // Données pour les filtres
  bureaux = signal<any[]>([]);
  categories = signal<any[]>([]);
  zones = signal<any[]>([]);
  noBureau = signal(false);

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(8);

  // États disponibles
  etatsDisponibles = [
    { value: 'neuf', label: 'Neuf', color: '#10b981' },
    { value: 'bon_etat', label: 'Bon état', color: '#3b82f6' },
    { value: 'usage', label: 'En usage', color: '#8b5cf6' },
    { value: 'en_panne', label: 'En panne', color: '#ef4444' },
    { value: 'seconde_main', label: 'Seconde main', color: '#10b981' },
    { value: 'en_maintenance', label: 'En maintenance', color: '#f59e0b' },
    { value: 'reforme', label: 'Hors service', color: '#6b7280' }
  ];

  // Équipements filtrés et triés
  filteredEquipements = computed(() => {
    let result = [...this.equipements()];

    // Filtre recherche
    const searchTerm = this.search().toLowerCase();
    if (searchTerm) {
      result = result.filter(e =>
        e.designation?.toLowerCase().includes(searchTerm) ||
        e.code_interne?.toLowerCase().includes(searchTerm) ||
        e.marque?.toLowerCase().includes(searchTerm) ||
        e.modele?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtre catégorie
    if (this.selectedCategorie()) {
      result = result.filter(e => e.categorie_slug === this.selectedCategorie());
    }

    // Filtre état
    if (this.selectedEtat()) {
      result = result.filter(e => e.etat === this.selectedEtat());
    }

    // Filtre bureau
    if (this.selectedBureau()) {
      // console.log(this.selectedBureau());
      result = result.filter(e => e.bureau_slug === this.selectedBureau());
    }

    // Filtre zone
    if (this.selectedZone()) {
      result = result.filter(e => e.zone_slug === this.selectedZone());
    }

    // Tri
    result.sort((a, b) => {
      let aVal = a[this.sortBy()];
      let bVal = b[this.sortBy()];

      // Pour les objets imbriqués
      if (this.sortBy() === 'categorie') {
        aVal = a.categorie?.nom || '';
        bVal = b.categorie?.nom || '';
      } else if (this.sortBy() === 'bureau') {
        aVal = a.bureau?.nom || '';
        bVal = b.bureau?.nom || '';
      } else if (this.sortBy() === 'zone') {
        aVal = a.zone?.nom || '';
        bVal = b.zone?.nom || '';
      } else if (this.sortBy() === 'dernier_responsable') {
        aVal = a.dernier_responsable?.nom_complet || '';
        bVal = b.dernier_responsable?.nom_complet || '';
      }

      aVal = aVal || '';
      bVal = bVal || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return this.sortOrder() === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortOrder() === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  });

  // Statistiques
  stats = computed(() => ({
    total: this.filteredEquipements().length,
    parEtat: {
      neuf: this.filteredEquipements().filter(e => e.etat === 'neuf').length,
      seconde_main: this.filteredEquipements().filter(e => e.etat === 'seconde_main').length,
      en_panne: this.filteredEquipements().filter(e => e.etat === 'en_panne').length,
      en_maintenance: this.filteredEquipements().filter(e => e.etat === 'en_maintenance').length,
      reforme: this.filteredEquipements().filter(e => e.etat === 'reforme').length
    }
  }));

  // Nombre de filtres actifs
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.search()) count++;
    if (this.selectedCategorie()) count++;
    if (this.selectedEtat()) count++;
    if (this.selectedBureau()) count++;
    if (this.selectedZone()) count++;
    return count;
  });

  private equipementSvr = inject(EquipementsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private authservice = inject(AuthService);
  private bureauSvr = inject(BureauxService);
  private categorieSvr = inject(CategoriesService);
  private zoneSvr = inject(ZonesService);

  constructor() {
    effect(() => {
      // Déclenché à chaque changement de filtre
      this.currentPage.set(1);
    });
  }

  ngOnInit() {
    this.isDG.set(this.authservice.isDG());
    this.isResponsable.set(this.authservice.isResponsable())
    this.loadInitialData();
  }

  async loadInitialData() {
    await Promise.all([
      this.loadBureaux(),
      this.loadCategories(),
      this.loadZoneByRole()
    ]);
    this.loadEquipementByRole();
  }

  loadEquipementByRole() {
    if (this.authservice.isDG()) {
      this.loadEquipements();
    } else {
      const bureauId = this.authservice.getCurrentUser()?.employe?.bureau?.slug;
      if (bureauId) {
        this.loadEquipementByBureau(bureauId);
      } else {
        this.bureaux.set([]);
        this.noBureau.set(true);
        this.isLoading.set(false);
        this.snackBar.open('Impossible de charger les équipements : aucun bureau associé à votre compte',
          'Fermer',
          { duration: 4000, panelClass: ['snackbar-error'] }
        );
      }
    }
  }

  loadEquipements() {
    this.isLoading.set(true);
    this.equipementSvr.getList().subscribe({
      next: (res) => {
        this.equipements.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showError('Erreur lors du chargement des équipements');
      }
    });
  }

  loadEquipementByBureau(bureauId: string) {
    this.isLoading.set(true);
    this.equipementSvr.getEquipementByBureau(bureauId).subscribe({
      next: (res: any) => {
        this.equipements.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showError('Erreur lors du chargement de vos équipements');
      }
    });
  }

  loadCategories() {
    return new Promise((resolve) => {
      this.categorieSvr.getAll().subscribe({
        next: (res: any) => {
          this.categories.set(res);
          resolve(true);
        },
        error: () => {
          this.showError('Erreur lors du chargement des catégories');
          resolve(false);
        }
      });
    });
  }

  loadBureaux() {
    return new Promise((resolve) => {
      this.bureauSvr.getAll().subscribe({
        next: (res: any) => {
          this.bureaux.set(res);
          resolve(true);
        },
        error: () => {
          this.showError('Erreur lors du chargement des bureaux');
          resolve(false);
        }
      });
    });
  }

  loadZones() {
    return new Promise((resolve) => {
      this.zoneSvr.getAll().subscribe({
        next: (res: any) => {
          this.zones.set(res);
          resolve(true);
        },
        error: () => {
          this.showError('Erreur lors du chargement des pièces');
          resolve(false);
        }
      });
    });
  }

  loadZonesByBureau(bureauSlug: string) {
    const bureauId = this.authservice.getCurrentUser()?.employe?.bureau?.slug;
    this.zoneSvr.getZonesByBureau(bureauId).subscribe({
      next: (res: any) => {
        this.zones.set(res);
      },
      error: () => {
        this.showError('Erreur lors du chargement de vos pièces');
      }
    });
  }

  loadZoneByRole(){
    if (this.authservice.isDG()) {
      this.loadZones();
    } else {
      const bureauId = this.authservice.getCurrentUser()?.employe?.bureau?.slug;
      if (bureauId) {
        this.loadZonesByBureau(bureauId);
      } else {
        this.zones.set([]);
      }
    }
  }

  resetFilters() {
    this.search.set('');
    this.selectedCategorie.set('');
    this.selectedEtat.set('');
    this.selectedBureau.set('');
    this.selectedZone.set('');
    this.sortBy.set('designation');
    this.sortOrder.set('asc');
    this.currentPage.set(1);
  }

  toggleSort(column: string) {
    if (this.sortBy() === column) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortBy() !== column) return 'unfold_more';
    return this.sortOrder() === 'asc' ? 'expand_less' : 'expand_more';
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: {
        title: 'un équipement',
        fields: [
          { name: 'code_interne', label: 'Code interne', type: 'text', validators: ['required'] },
          { name: 'designation', label: 'Désignation', type: 'text', validators: ['required'] },
          { name: 'categorie_slug', label: 'Catégorie', type: 'select2', validators: ['required'],
            options: this.categories().map((cat: any) => ({ value: cat.slug, label: cat.nom }))
          },
          { name: 'marque', label: 'Marque', type: 'text', validators: ['required'] },
          { name: 'modele', label: 'Modèle', type: 'text' },
          { name: 'numero_serie', label: 'Numéro de série', type: 'text' },
          { name: 'configuration', label: 'Configuration', type: 'text' },
          { name: 'etat', label: 'Etat', type: 'select2',
            options: this.etatsDisponibles, validators: ['required']
          },
          { name: 'prix_achat', label: 'Prix d\'achat', type: 'text' },
          { name: 'date_garantie_fin', label: 'Date de fin de garantie', type: 'datePic'},
          { name: 'bureau_slug', label: 'Bureau', type: 'select2', validators: ['required'],
            options: this.bureaux().map((b: any) => ({ value: b.rh_slug, label: b.acronyme }))
          },
          { name: 'notes', label: 'Note', type: 'textarea' },
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading.set(true);
        this.equipementSvr.addEquipement(formData).subscribe({
          next: (res) => {
            this.loadEquipementByRole();
            this.showSuccess(res.message || 'Équipement ajouté avec succès ✅');
          },
          error: (err) => {
            this.isLoading.set(false);
            this.showError(err.error?.message || 'Échec lors de l\'ajout de l\'équipement');
          }
        });
      }
    });
  }
  openEditDialog(equipement: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: {
        title: 'un équipement',
        item: equipement,
        fields: [
          { name: 'code_interne', label: 'Code interne', type: 'text', validators: ['required'] },
          { name: 'designation', label: 'Désignation', type: 'text', validators: ['required'] },
          { name: 'categorie_slug', label: 'Catégorie', type: 'select2', validators: ['required'],
            options: this.categories().map((cat: any) => ({ value: cat.slug, label: cat.nom }))
          },
          { name: 'marque', label: 'Marque', type: 'text', validators: ['required'] },
          { name: 'modele', label: 'Modèle', type: 'text' },
          { name: 'numero_serie', label: 'Numéro de série', type: 'text' },
          { name: 'configuration', label: 'Configuration', type: 'text' },
          { name: 'etat', label: 'Etat', type: 'select2',
            options: this.etatsDisponibles, validators: ['required']
          },
          { name: 'prix_achat', label: 'Prix d\'achat', type: 'text' },
          { name: 'date_garantie_fin', label: 'Date de fin de garantie', type: 'datePic'},
          // { name: 'bureau_slug', label: 'Bureau', type: 'select2',
          //   options: this.bureaux().map((b: any) => ({ value: b.rh_slug, label: b.acronyme }))
          // },
          { name: 'notes', label: 'Note', type: 'textarea' },
        ]
      }
    });

    dialogRef.afterClosed().subscribe(formData => {
      if (formData) {
        this.isLoading.set(true);
        this.equipementSvr.updateEquipement(equipement.slug, formData).subscribe({
          next: (res) => {
            this.loadEquipementByRole();
            this.showSuccess(res.message || 'Équipement mis à jour avec succès ✅');
          },
          error: (err) => {
            this.isLoading.set(false);
            this.showError(err.error?.message || 'Échec lors de la mise à jour de l\'équipement');
          }
        });
      }
    });
  }

  openDeleteModal(item: any) {
    this.itemToDelete.set(item);
    this.showConfirmModal.set(true);
  }

  confirmDelete() {
    if (!this.itemToDelete()) return;
    this.isLoading.set(true);

    this.equipementSvr.deleteEquipement(this.itemToDelete().slug).subscribe({
      next: () => {
        this.closeModal();
        this.loadEquipementByRole();
        this.showSuccess('Équipement supprimé avec succès ✅');
      },
      error: () => {
        this.closeModal();
        this.isLoading.set(false);
        this.showError('Échec lors de la suppression de l\'équipement');
      }
    });
  }

  closeModal() {
    this.showConfirmModal.set(false);
    this.itemToDelete.set(null);
  }

  openView(eq: any) {
    const dialogRef = this.dialog.open(DetailsEquipementComponent, {
      data: eq,
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false,
      width: 'auto',
      maxWidth: '90vw'
    });
    dialogRef.afterClosed().subscribe((result) => {
      // this.isLoading.set(true); // Afficher un loader
      // this.loadEquipementByRole();
    });
  }


  openCreate() {
    this.dialog.open(CuEquipementComponent, {
      width: 'auto',
      maxWidth: '90vw',
    });
  }

  openEdit(equipement: any) {
    this.dialog.open(CuEquipementComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: equipement
    });
  }

  openAffectation(equipement: any) {
    const dialogRef = this.dialog.open(AssignEquipementComponent, {
      width: 'auto',
      maxWidth: '90vw',
      data: equipement
    });

    // Écouter le résultat du dialog
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Succès - Afficher le toast
        this.snackBar.open(
          result.message || 'Affectation réalisée avec succès !', 
          'Fermer', 
          { 
            duration: 5000,
            panelClass: ['success-snackbar'],
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }
        );
        
        // Rafraîchir la liste des équipements si nécessaire
        this.loadEquipements(); // Appelez votre méthode de rechargement
      } 
      else if (result && !result.success) {
        // Erreur - Afficher le toast d'erreur
        this.snackBar.open(
          result.message || 'Erreur lors de l\'affectation', 
          'Fermer', 
          { 
            duration: 5000,
            panelClass: ['error-snackbar'],
            horizontalPosition: 'end',
            verticalPosition: 'top'
          }
        );
      }
    });
  }

  openCreateMouvement(equipement: any): void {
    const nonAssignableStates = ['reforme', 'en_panne', 'en_maintenance'];

    if (nonAssignableStates.includes(equipement.etat)) {
      const etatLabel = this.getEtatLabel(equipement.etat);
      this.snackBar.open(
        `❌ Impossible : l'équipement est ${etatLabel.toLowerCase()}`,
        'Fermer',
        { duration: 4000, panelClass: 'error-snackbar' }
      );
      return;
    }

    // if (equipement.disponible === 0) {
    //   this.snackBar.open(
    //     '❌ Impossible : l\'équipement n\'est pas disponible',
    //     'Fermer',
    //     { duration: 4000, panelClass: 'error-snackbar' }
    //   );
    //   return;
    // }
    const dialogRef = this.dialog.open(MvtEquipementComponent, {
      data: { equipement: equipement },
      panelClass: 'custom-dialog-container',
      backdropClass: 'custom-backdrop',
      autoFocus: false,
      width: 'auto',
      maxWidth: '90vw'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.loadEquipementByRole();
        this.snackBar.open('Mouvement enregistré, en attente de validation', 'Fermer', { duration: 3000 });
      }
    });
  }

  getEtatBadgeClass(etat: string): string {
    const map: any = {
      neuf: 'etat-neuf',
      bon_etat: 'etat-bon',
      usage: 'etat-usage',
      en_panne: 'etat-panne',
      en_maintenance: 'etat-maintenance',
      reforme: 'etat-reforme'
    };
    return map[etat] || 'etat-default';
  }

  getEtatColor(etat: string): string {
    const etatObj = this.etatsDisponibles.find(e => e.value === etat);
    return etatObj?.color || '#6b7280';
  }

  getEtatLabel(etat: string): string {
    const map: any = {
      neuf: 'Neuf',
      bon_etat: 'Bon état',
      usage: 'En usage',
      en_panne: 'En panne',
      en_maintenance: 'Maintenance',
      reforme: 'Hors service'
    };
    return map[etat] || etat;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // Pagination
  paginatedEquipements = computed(() => {
    const allFiltered = this.filteredEquipements();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return allFiltered.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredEquipements().length / this.itemsPerPage());
  });

  paginationInfo = computed(() => {
    const total = this.filteredEquipements().length;
    const start = (this.currentPage() - 1) * this.itemsPerPage() + 1;
    const end = Math.min(start + this.itemsPerPage() - 1, total);
    return `${start} - ${end} sur ${total}`;
  });

  private resetPaginationOnFilterChange() {
    effect(() => {
      void this.filteredEquipements(); // lecture forcée
      this.currentPage.set(1);
    });
  }
}
