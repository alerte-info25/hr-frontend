// taches.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TachesService } from '../../services/taches.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../loading/loading.component';
import { ServicesService } from '../../services/services.service';
import { EmployesService } from '../../services/employes.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
@Component({
  selector: 'app-taches',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './taches.component.html',
  styleUrl: './taches.component.scss'
})
export class TachesComponent implements OnInit {
  isLoading: boolean = true;
  taches = signal<any[]>([]);
  mockListTaches:any[]=[];
  servicesListe:any[]=[];
  employesListe:any[]=[];
  employesFiltres = signal<any[]>([]);
  showConfirmModal = false;
  itemToDelete: any = null;

  // objet pour gérer l'affichage des sous-tâches
  showSousTachesMap: { [key: string]: boolean } = {};

  toggleSousTaches(tache: any) {
    this.showSousTachesMap[tache.id] = !this.showSousTachesMap[tache.id];
  }

  isSousTachesVisible(tache: any) {
    return !!this.showSousTachesMap[tache.id];
  }
  filterActive = signal<'all' | 'encours' | 'retard' | 'terminées'>('all');

  searchTerm = signal('');
  showModal = signal(false);
  showDetailModal = signal(false);
  selectedTache = signal<any | null>(null);
  isEditMode = signal(false);

  tacheForm!: FormGroup;
  services = signal(this.servicesListe);
  employes = signal(this.employesListe);

  constructor(
    private fb: FormBuilder,
    private tacheSvr: TachesService,
    private snackBar: MatSnackBar,
    private serviceSvr: ServicesService,
    private empSvr: EmployesService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadTaches();
    this.watchServiceChange(  )
  }

  initForm() {
    this.tacheForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      assigne_au_service: [''],
      assigne_a_employe: [''],
      delai: ['', Validators.required],
      visible: [0]
    });
  }

  watchServiceChange() {
    this.tacheForm.get('assigne_au_service')!.valueChanges.subscribe(serviceSlug => {
      const allEmployes = this.employes();
      if (!serviceSlug) {
        this.employesFiltres.set(allEmployes); // aucun filtre
      } else {
        const filtered = allEmployes.filter(emp => emp.id_service === serviceSlug);
        this.employesFiltres.set(filtered);
      }
      // réinitialiser la sélection de l'employé
      this.tacheForm.get('assigne_a_employe')!.setValue('');
    });
  }
  currentUser = signal<any>(JSON.parse(localStorage.getItem('user_token') || '{}'));

  canEdit(tache: any): boolean {
    const user = this.currentUser();
    const role = user.role?.slug;
    const empSlug = user.id_employe;
    const chefService = user.employe?.service?.id_chef; // si dispo côté token

    // Directeur : peut modifier les tâches qu'il a assignées
    if (role === 'dxom5hysz5q6') return tache.assigne_par === empSlug;

    // RH : tout peut être modifié
    if (role === 'dcslduudp57jdl') return true;

    // Chef de service : peut modifier toutes les tâches de son service
    if (role === 'spdi67kdus3gsh' && chefService === empSlug)
      return tache.assigne_au_service === user.employe.id_service || tache.assigne_a_employe === empSlug;

    // Employé : seulement ses tâches
    if (role === 'spdi67kdus3gsh') return tache.assigne_a_employe === empSlug;

    return false;
  }

  canDelete(tache: any): boolean {
    return this.canEdit(tache);
  }

  filteredTaches = computed(() => {
    const user = this.currentUser();
    const empSlug = user.id_employe;
    const role = user.role?.slug;

    return this.taches().filter(t => {
      if (role === 'dxom5hysz5q6') return t.visible === 1;
      if (role === 'dcslduudp57jdl') return true;
      if (role === 'spdi67kdus3gsh' && t.assigne_a_employe === empSlug) return true;
      if (role === 'spdi67kdus3gsh' && t.assigne_au_service === user.employe?.id_service) return true;
      return false;
    });
  });



  loadTaches() {
    this.isLoading = true
    this.tacheSvr.getList().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.mockListTaches = data;
        const tachesAvecToggle = data.map(t => ({
          ...t,
          showSousTaches: signal(false)
        }));
        this.taches.set(this.mockListTaches);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      }
    })
    this.empSvr.getList().subscribe({
      next: (data) => {
        this.isLoading = false
        this.employesListe = data
        this.employes.set(data);
        this.employesFiltres.set(data);
      }
    })
    this.serviceSvr.getList().subscribe({
      next: (data) => {
        this.isLoading = false
        this.servicesListe = data
        this.services.set(data);
      }
    })

  }
  // CRUD

  openModal(tache?: any) {
    if (tache) {
      this.isEditMode.set(true);
      this.tacheForm.patchValue(tache);
      this.selectedTache.set(tache);
    } else {
      this.isEditMode.set(false);
      this.tacheForm.reset({ visible: 0 });
      this.selectedTache.set(null);
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.tacheForm.reset();
  }

  openDetailModal(tache: any) {
    this.selectedTache.set(tache);
    this.showDetailModal.set(true);
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
  }

  submitTache() {
    if (this.tacheForm.valid) {
      const formValue = this.tacheForm.value;
      const user = JSON.parse(localStorage.getItem('user_token') || '{}');
      const assigne_par = user?.id_employe;

      // Déterminer si c’est une sous-tâche
      const id_parent = this.selectedTache()?.slug || null;

      const payload = {
        ...formValue,
        assigne_par,
        id_parent,
        progression: 0,
        statut: 1
      };

      this.isLoading = true;

      if (this.isEditMode()) {
        // ✅ Mise à jour d'une tâche existante
        this.tacheSvr.updateTaches(this.selectedTache()?.slug, payload).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.closeModal();
            this.snackBar.open(res.message, 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.loadTaches(); // Rechargement complet
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.message, 'Fermer', {
              duration: 4000,
              panelClass: ['toast-error']
            });
          }
        });

      } else {
        // ✅ Création (tâche principale ou sous-tâche)
        this.tacheSvr.addTaches(payload).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.closeModal();
            this.snackBar.open(res.message, 'Fermer', {
              duration: 3000,
              panelClass: ['toast-success']
            });
            this.loadTaches(); // Rechargement complet
          },
          error: (err) => {
            this.isLoading = false;
            this.snackBar.open(err.message, 'Fermer', {
              duration: 4000,
              panelClass: ['toast-error']
            });
          }
        });
      }
    }
  }

  updateProgression(tache: any, progression: number) {
    const updated = this.taches().map(t =>
      t.id === tache.id ? { ...t, progression } : t
    );
    this.taches.set(updated);
    const data ={
      'progression':progression
    }
    this.isLoading = true
    this.tacheSvr.progressionTaches(tache.slug, data).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.loadTaches();
        this.snackBar.open(res.message,'Fermer',{
          duration: 3000,
          panelClass: ['toast-success']
        })
      },
      error: (err) =>{
        this.isLoading = false;
        this.snackBar.open(err.message,'Fermer',{
          duration: 4000,
          panelClass: ['toast-error']
        })
      }
    })
  }

  toggleVisibility(tache: any) {
    const nouvelleVisibilite = tache.visible === 1 ? 0 : 1;

    this.isLoading = true;
    const updated = this.taches().map(t =>
      t.id === tache.id ? { ...t, visible: nouvelleVisibilite } : t
    );
    this.taches.set(updated);
    const data ={
      'visibilite':nouvelleVisibilite
    }
    this.tacheSvr.viewsTaches(tache.slug, data).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.loadTaches();
        this.snackBar.open(res.message || 'Visibilité mise à jour', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.message || 'Erreur lors de la mise à jour', 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });

        // Annule le changement local si erreur
        const reverted = this.taches().map(t =>
          t.id === tache.id ? { ...t, visible: tache.visible } : t
        );
        this.taches.set(reverted);
      }
    });
  }


   // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;

    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.tacheSvr.deleteTaches(this.itemToDelete.slug).subscribe({
      next: (res) => {
        this.closeDeleteModal();
        this.loadTaches();
        this.snackBar.open(res.message || 'Tâche supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeDeleteModal();
        this.isLoading = false;
        this.snackBar.open(err.message || 'Echec lors de la suppression de la tâche ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }
  // Ferme le modal sans supprimer
  closeDeleteModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
// END CRUD
    getProgressColor(progression: number): string {
      if (progression < 30) return '#ef4444';
      if (progression < 70) return '#f59e0b';
      return '#10b981';
    }

    getStatusBadge(tache: any): string {
    switch (tache.statut) {
      case 1:
        return 'En cours';
      case 2:
        return 'Terminée';
      case 3:
        return 'En retard';
      default:
        return 'Inconnu';
    }
  }

  getStatusClass(tache: any): string {
    switch (tache.statut) {
      case 1:
        return 'badge-warning'; // Jaune - En cours
      case 2:
        return 'badge-success'; // Vert - Terminée
      case 3:
        return 'badge-danger';  // Rouge - En retard
      default:
        return 'badge-secondary'; // Gris - Inconnu
    }
  }


  // SOUS TACHES

    openSousTacheModal(parentTache: any) {
      this.selectedTache.set(parentTache);
      this.isEditMode.set(false);

      this.tacheForm.reset({
          titre: '',
          description: '',
          assigne_au_service: '',
          assigne_a_employe: '',
          delai: '',
          visible: 0
      });

      this.showModal.set(true);
    }
}
