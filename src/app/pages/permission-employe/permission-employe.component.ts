import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TypePermissionsService } from '../../services/type-permissions.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';
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
export class PermissionEmployeComponent implements OnInit {
  isLoading: boolean = false;
  @Input() showDetailsModal: boolean = false;
  @Input() permissionSelectionnee: any = null;
  permissions: any[] = [];
  typesPermission: any[] = [];
  user: any;
  showModal = false;
  isEditMode = false;
  currentPermission: any = this.getEmptyPermission();
  currentPage = 1;
  itemsPerPage = 8;
  selectedFiles: File[] = [];
  documentsToDelete: string[] = [];
  showConfirmModal = false;
  itemToDelete: any = null;
  isDragging = false;

  // Configuration des fichiers
  maxFiles = 3;
  maxFileSize = 10 * 1024 * 1024; // 10 Mo
  allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

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

  // ========== CHARGEMENT DES DONNÉES ==========

  loadPermissions(): void {
    this.isLoading = true;
    this.permissionSvr.getPermissionByEmp(this.user?.employe.slug).subscribe({
      next: (data) => {
        this.permissions = data;
        this.isLoading = false;
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

  // ========== FILTRES ET PAGINATION ==========

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

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedType = null;
    this.currentPage = 1;
  }

  // ========== GESTION DES STATUTS ==========

  getstatusLabels(statut: number): string {
    switch (statut) {
      case 1: return 'En attente';
      case 2: return 'Acceptée';
      case 3: return 'Refusée';
      default: return 'Inconnu';
    }
  }

  getStatutBadge(status: number): string {
    switch(status) {
      case 1: return "badge rounded-pill bg-warning text-dark";
      case 2: return "badge rounded-pill bg-success";
      case 3: return "badge rounded-pill bg-danger";
      default: return "badge rounded-pill bg-secondary";
    }
  }

  // ========== GESTION DES DOCUMENTS ==========

  validateFile(file: File): { valid: boolean; message?: string } {
    // Vérifier l'extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!this.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        message: `Le fichier "${file.name}" n'est pas autorisé. Types acceptés : PDF, JPG, PNG, GIF, WEBP, SVG`
      };
    }

    // Vérifier le type MIME
    if (!this.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        message: `Le fichier "${file.name}" a un type non autorisé.`
      };
    }

    // Vérifier la taille
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        message: `Le fichier "${file.name}" dépasse la taille maximale de 10 Mo.`
      };
    }

    return { valid: true };
  }

  onFileSelect(event: any): void {
    const files: FileList = event.target.files;

    if (this.selectedFiles.length + files.length > this.maxFiles) {
      this.snackBar.open(
        `Vous ne pouvez pas uploader plus de ${this.maxFiles} fichiers`,
        'Fermer',
        { duration: 3000, panelClass: ['toast-warning'] }
      );
      return;
    }

    let validFiles: File[] = [];
    let errors: string[] = [];

    for (let i = 0; i < files.length && this.selectedFiles.length + validFiles.length < this.maxFiles; i++) {
      const file = files[i];
      const validation = this.validateFile(file);

      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.message || `Erreur de validation pour ${file.name}`);
      }
    }

    // Ajouter les fichiers valides
    this.selectedFiles = [...this.selectedFiles, ...validFiles];

    // Afficher les erreurs
    if (errors.length > 0) {
      errors.forEach(error => {
        this.snackBar.open(error, 'Fermer', {
          duration: 4000,
          panelClass: ['toast-error']
        });
      });
    }

    // Réinitialiser l'input file
    event.target.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const fakeEvent = { target: { files: fileArray } };
      this.onFileSelect(fakeEvent);
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
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
          if (this.currentPermission) {
            this.currentPermission.documents = this.currentPermission.documents
              .filter((doc: any) => doc.slug !== documentSlug);
          }
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

  // ========== DÉTECTION DES TYPES DE DOCUMENTS ==========

  isImageDocument(doc: any): boolean {
    return doc.type === 'image' ||
           ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(doc.extension?.toLowerCase());
  }

  isPdfDocument(doc: any): boolean {
    return doc.type === 'pdf' || doc.extension?.toLowerCase() === 'pdf';
  }

  getDocumentIcon(doc: any): string {
    if (this.isImageDocument(doc)) {
      return 'fa-file-image';
    }
    if (this.isPdfDocument(doc)) {
      return 'fa-file-pdf';
    }
    return 'fa-file';
  }

  getDocumentColor(doc: any): string {
    if (this.isImageDocument(doc)) {
      return 'text-primary';
    }
    if (this.isPdfDocument(doc)) {
      return 'text-danger';
    }
    return 'text-secondary';
  }

  getFileTypeLabel(file: File): string {
    if (file.type.startsWith('image/')) {
      return 'Image';
    }
    if (file.type === 'application/pdf') {
      return 'PDF';
    }
    return 'Fichier';
  }

  // ========== GESTION DU MODAL ==========

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

  openDetailsModal(permission: any) {
    this.permissionSelectionnee = permission;
    this.showDetailsModal = true;
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.permissionSelectionnee = null;
  }

  // ========== CRUD PERMISSIONS ==========

  savePermission(): void {
    const now = new Date();
    const debut = new Date(this.currentPermission.debut);
    const fin = new Date(this.currentPermission.fin);

    if (fin < debut) {
      this.snackBar.open('La date de retour ne peut pas être antérieure à la date de départ', 'Fermer', {
        duration: 3000,
        panelClass: ['toast-error']
      });
      return;
    }

    if (!this.currentPermission.raison.trim()) {
      this.snackBar.open('Veuillez fournir une raison pour votre demande', 'Fermer', {
        duration: 3000,
        panelClass: ['toast-error']
      });
      return;
    }

    // Vérifier que les fichiers sont valides avant l'envoi
    if (this.selectedFiles.length > 0) {
      for (const file of this.selectedFiles) {
        const validation = this.validateFile(file);
        if (!validation.valid) {
          this.snackBar.open(validation.message || 'Fichier invalide', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-error']
          });
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append('debut', this.currentPermission.debut);
    formData.append('fin', this.currentPermission.fin);
    formData.append('raison', this.currentPermission.raison);
    formData.append('id_type', this.currentPermission.id_type);
    formData.append('id_employe', this.user?.employe.slug);

    // Ajouter les fichiers avec les bons indices pour Laravel
    this.selectedFiles.forEach((file, index) => {
      formData.append(`documents[${index}]`, file, file.name);
    });

    if (this.isEditMode) {
      this.isLoading = true;
      this.permissionSvr.updatePermission(this.currentPermission.slug, formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Permission mise à jour avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });
          this.loadPermissions();
          this.closeModal();
        },
        error: (err) => {
          this.isLoading = false;
          this.snackBar.open(err.error.message || 'Erreur lors de la mise à jour de la permission', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-error']
          });
          console.error(err);
        }
      });
    } else {
      this.isLoading = true;
      this.permissionSvr.addPermission(formData).subscribe({
        next: () => {
          this.isLoading = false;
          this.snackBar.open('Permission créée avec succès ✅', 'Fermer', {
            duration: 3000,
            panelClass: ['toast-success']
          });
          this.loadPermissions();
          this.closeModal();
        },
        error: (err) => {
          this.isLoading = false;
          const errorMsg = err.error?.message || 'Erreur lors de la création de la permission';
          this.snackBar.open(errorMsg, 'Fermer', {
            duration: 3000,
            panelClass: ['toast-error']
          });
          console.error(err);
        }
      });
    }
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
        this.snackBar.open('Demande supprimée avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.loadPermissions();
      },
      error: (err) => {
        this.closeDeleteModal();
        this.snackBar.open('Échec lors de la suppression de la demande ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }

  closeDeleteModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

  // ========== UTILITAIRES ==========

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

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
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

  createObjectURL(file: File): string {
    return URL.createObjectURL(file);
  }
}
