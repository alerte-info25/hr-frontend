import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TypePermissionsService } from '../../services/type-permissions.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
import { DetailsPermissionsComponent } from '../details-permissions/details-permissions.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermissionService } from '../../services/permission.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';
import { LoadingComponent } from '../loading/loading.component';

declare var bootstrap: any;
@Component({
  selector: 'app-permission-employe',
  imports: [CommonModule, FormsModule, ConfirmDeleteDialogComponent, ReactiveFormsModule, LoadingComponent],
  templateUrl: './permission-employe.component.html',
  styleUrl: './permission-employe.component.scss',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(20px) scale(0.95)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateY(0) scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateY(20px) scale(0.95)', opacity: 0 }))
      ])
    ])
  ]
})
export class PermissionEmployeComponent {
  isLoading: boolean = false;
  @Input() showDetailsModal: boolean = false;
  @Input() permissionSelectionnee: any = null;

  permissions: any[] = [];
  typesPermission: any[] = [];
  user:any;
  showModal = false;
  isEditMode = false;
  currentPermission: any = this.getEmptyPermission();

  currentPage = 1;
  itemsPerPage = 8;

  selectedFiles: File[] = [];
  documentsToDelete: string[] = [];

  showConfirmModal = false;
  itemToDelete: any = null;

  getstatusLabels(statut:number) {
    switch (statut) {
      case 1: return 'En attente';
      case 2: return 'Acceptée';
      case 3: return 'Refusée';
      default: return 'Inconnu';
    }
  };

  getStatutBadge(status:number):string{
    switch(status){
      case 1: return "badge rounded-pill bg-warning text-dark";
      case 2: return "badge rounded-pill bg-success";
      case 3: return "badge rounded-pill bg-danger";
      default: return "badge rounded-pill bg-secondary";
    }
  }

  // Filtres et recherche
  searchQuery = '';
  selectedStatus: number | null = null;
  selectedType: string | null = null;

  constructor(
    private typePermissionService: TypePermissionsService,
    private snackBar: MatSnackBar,
    private permissionSvr: PermissionService,
    private authSvr: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    this.loadPermissions();
    this.loadTypesPermission();
  }

  loadPermissions(): void {
    this.isLoading = true;
    this.permissionSvr.getPermissionByEmp(this.user?.employe.slug).subscribe({
      next: (data) => {
        this.permissions = data;
        this.isLoading = false
        this.snackBar.open('Permissions chargées avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Erreur lors du chargement des permissions', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  loadTypesPermission(): void {
    // TODO: Appel au service Angular
    this.typePermissionService.getList().subscribe({
      next: (data) => {
        this.typesPermission = data;
      },
      error: (err) => {
        this.snackBar.open(err.error.message || 'Erreur lors du chargement des types de permission', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  get filteredPermissions(): any[] {
    return this.permissions.filter(perm => {
      const matchesSearch = !this.searchQuery ||
        perm.raison.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.type?.nom.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = this.selectedStatus === null || perm.statut === this.selectedStatus;
      const matchesType = !this.selectedType || perm.id_type === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  openModal(permission?: any): void {
    if (permission) {
      this.isEditMode = true;
      this.currentPermission = { ...permission };
      this.documentsToDelete = [];
    } else {
      this.isEditMode = false;
      this.currentPermission = this.getEmptyPermission();
    }
    this.selectedFiles = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentPermission = this.getEmptyPermission();
    this.selectedFiles = [];
    this.documentsToDelete = [];
  }

  onFileSelect(event: any): void {
    const files: FileList = event.target.files;
    const maxFiles = 3;
    const maxSize = 10 * 1024 * 1024; // 10 Mo en octets

    if (this.selectedFiles.length + files.length > maxFiles) {
      alert(`Vous ne pouvez pas uploader plus de ${maxFiles} fichiers`);
      return;
    }

    for (let i = 0; i < files.length && this.selectedFiles.length < maxFiles; i++) {
      const file = files[i];

      // Vérification du type
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {

        // Vérification de la taille
        if (file.size > maxSize) {
          alert(`Le fichier "${file.name}" dépasse la taille maximale de 10 Mo.`);
          continue;
        }

        this.selectedFiles.push(file);

      } else {
        alert(`Le fichier "${file.name}" n'est pas un PDF ou une image valide.`);
      }
    }
  }

  deleteTheDocument(documentSlug: string, permissionSlug: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.isLoading = true;

      this.permissionSvr.deleteDocument(documentSlug).subscribe({
        next: () => {
          this.isLoading = false;

          this.snackBar.open('Document supprimé avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });

          // 🔥 Mise à jour DIRECTE de la vue
          if (this.currentPermission) {
            this.currentPermission.documents = this.currentPermission.documents
              .filter((doc: any) => doc.slug !== documentSlug);
          }

          // 🔁 Mise à jour liste principale (optionnel mais propre)
          const permission = this.permissions.find(p => p.slug === permissionSlug);
          if (permission) {
            permission.documents = permission.documents
              .filter((doc: any) => doc.slug !== documentSlug);
          }
        },

        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(
            err.error.message || 'Erreur lors de la suppression du document ❌',
            'Fermer',
            { duration: 3000, panelClass: ['toast-error'] }
          );
        }
      });
    }
  }


  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  markDocumentForDeletion(slug: string): void {
    if (!this.documentsToDelete.includes(slug)) {
      this.documentsToDelete.push(slug);
    }
  }

  isDocumentMarkedForDeletion(slug: string): boolean {
    return this.documentsToDelete.includes(slug);
  }

  cancelDocumentDeletion(slug: string): void {
    const index = this.documentsToDelete.indexOf(slug);
    if (index > -1) {
      this.documentsToDelete.splice(index, 1);
    }
  }

  savePermission(): void {
    // Validation des dates
    const now = new Date();
    const debut = new Date(this.currentPermission.debut);
    const fin = new Date(this.currentPermission.fin);

    // if (debut < now) {
    //   alert('La date de départ ne peut pas être antérieure à aujourd\'hui');
    //   return;
    // }

    if (fin < debut) {
      alert('La date de retour ne peut pas être antérieure à la date de départ');
      return;
    }

    if (!this.currentPermission.raison.trim()) {
      alert('Veuillez fournir une raison pour votre demande');
      return;
    }

    // TODO: Appel au service pour créer/modifier
    const formData = new FormData();
    formData.append('debut', this.currentPermission.debut);
    formData.append('fin', this.currentPermission.fin);
    formData.append('raison', this.currentPermission.raison);
    formData.append('id_type', this.currentPermission.id_type);
    formData.append('id_employe', this.user?.employe.slug);
    this.selectedFiles.forEach((file, index) => {
      formData.append(`documents[${index}]`, file);
    });

    if (this.isEditMode) {
      this.isLoading = true;
      this.permissionSvr.updatePermission(this.currentPermission.slug, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Permission mise à jour avec succès', 'Fermer', { duration: 3000 });
          this.loadPermissions();
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(err.error.message || 'Erreur lors de la mise à jour de la permission', 'Fermer', { duration: 3000 });
          console.error(err);
        }
      });
    } else {
      this.isLoading = true;
      this.permissionSvr.addPermission(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Permission créée avec succès', 'Fermer', { duration: 3000 });
          this.loadPermissions();
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(err.error.message || 'Erreur lors de la création de la permission', 'Fermer', { duration: 3000 });
          console.error(err);
        }
      });
    }

    this.closeModal();
    // Recharger les permissions après sauvegarde
    // this.loadPermissions();
  }
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;

    this.permissionSvr.deletePermission(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.snackBar.open('Demande supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.loadPermissions();
        // this.isLoading = false;
      },
      error: (err) => {
        // this.isLoading = false;
        this.closeDeleteModal();
        this.snackBar.open('Echec lors de la suppression de la demande ❌', 'Fermer', {
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateShort(dateString: string): string {
    const date = new Date(dateString);

    const datePart = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const timePart = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${datePart} à ${timePart}`;
  }


  getDuration(debut: string, fin: string): string {
    const start = new Date(debut);
    const end = new Date(fin);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 jour';
    if (diffDays < 1) return 'Moins d\'un jour';
    return `${diffDays} jours`;
  }

  getMinDate(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  }

  getMinReturnDate(): string {
    if (this.currentPermission.debut) {
      return this.currentPermission.debut;
    }
    return this.getMinDate();
  }

  private getEmptyPermission(): any {
    return {
      debut: '',
      fin: '',
      statut: 1,
      raison: '',
      id_type: '',
      documents: []
    };
  }

  // formatFileSize(bytes: number): string {
  //   if (bytes < 1024) return bytes + ' B';
  //   if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  //   return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  // }
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';

    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedType = null;
    this.currentPage = 1;
  }

  openDetailsModal(permission: any) {
    this.permissionSelectionnee = permission;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.permissionSelectionnee = null;
  }

  // Pagination

  get paginatedPermissions(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPermissions.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPermissions.length / this.itemsPerPage);
  }
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getInitials(employe: any): string {
    if (!employe) return '??';

    const prenom = employe.prenom || '';
    const nom = employe.nom || '';

    const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    return initiales || '??';
  }

}
