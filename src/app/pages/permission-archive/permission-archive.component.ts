import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../material.module';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TypePermissionsService } from '../../services/type-permissions.service';

@Component({
  selector: 'app-permission-archive',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './permission-archive.component.html',
  styleUrl: './permission-archive.component.scss'
})
export class PermissionArchiveComponent implements OnInit {
  // Pagination toutes permissions
  currentPageToutes = 1;
  perPageToutes = 10;
  totalToutes = 0;
  toutesPermissions: any[] = [];
  isLoadingToutes: boolean = true;
  isSubmitting: boolean = false;
  showModal: boolean = false;
  permissionSelectionnee: any | null = null;

  // Filtres
  searchQuery = '';
  selectedStatus: number | null = null;
  selectedType: string | null = null;
  typesPermission: any[] = [];

  constructor(
    private permissionService: PermissionService,
    private typePermissionService: TypePermissionsService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.chargerToutesPermissions();
    this.loadTypesPermission();
  }

  // ========== CHARGEMENT DES DONNÉES ==========

  chargerToutesPermissions(): void {
    this.isLoadingToutes = true;
    this.permissionService.getListPermissionArchiver().subscribe({
      next: (response) => {
        this.isLoadingToutes = false;
        this.toutesPermissions = response;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des permissions:', error);
        this.snackbar.open(error.error.message || 'Erreur lors du chargement des permissions', 'Fermer', { duration: 4000 });
        this.isLoadingToutes = false;
      }
    });
  }

  loadTypesPermission(): void {
    this.typePermissionService.getList().subscribe({
      next: (data) => {
        this.typesPermission = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types:', err);
      }
    });
  }

  // ========== FILTRES ET RECHERCHE ==========

  get filteredPermissions(): any[] {
    return this.toutesPermissions.filter(perm => {
      const matchesSearch = !this.searchQuery ||
        perm.raison?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.type?.nom?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.employe?.nom?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.employe?.prenom?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = this.selectedStatus === null || perm.statut === this.selectedStatus;
      const matchesType = !this.selectedType || perm.id_type === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedType = null;
    this.currentPageToutes = 1;
  }

  onFilterChange(): void {
    this.currentPageToutes = 1;
  }

  // ========== PAGINATION ==========

  get paginatedToutesPermissions() {
    const start = (this.currentPageToutes - 1) * this.perPageToutes;
    return this.filteredPermissions.slice(start, start + this.perPageToutes);
  }

  get totalPagesToutes(): number {
    return Math.ceil(this.filteredPermissions.length / this.perPageToutes);
  }

  changerPageToutes(page: number) {
    if (page >= 1 && page <= this.totalPagesToutes) {
      this.currentPageToutes = page;
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

  getDocumentUrl(doc: any): string {
    if (!doc || !doc.url) {
      return '#';
    }
    if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
      return doc.url;
    }
    if (doc.url.startsWith('/storage/')) {
      return doc.url;
    }
    if (doc.url.startsWith('storage/')) {
      return '/' + doc.url;
    }
    if (!doc.url.startsWith('/') && !doc.url.startsWith('http')) {
      return '/storage/' + doc.url;
    }
    return doc.url;
  }

  getSafeUrl(url: string): SafeUrl {
    if (!url) {
      return this.sanitizer.bypassSecurityTrustUrl('#');
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return this.sanitizer.bypassSecurityTrustUrl(url);
    }
    const fullUrl = url.startsWith('/storage/') ? url : `/storage/${url}`;
    return this.sanitizer.bypassSecurityTrustUrl(fullUrl);
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  // ========== GESTION DES PERMISSIONS ==========

  desarchiverPermission(permission: any): void {
    if (!permission) return;
    this.isSubmitting = true;
    this.permissionService.desarchivePermission(permission.slug).subscribe({
      next: (res) => {
        this.snackbar.open(res.message || 'Permission désarchivée avec succès ✅', 'Fermer', { duration: 3000 });
        this.chargerToutesPermissions();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur lors du désarchivage:', err);
        this.snackbar.open(err.error.message || 'Erreur lors du désarchivage de la permission ❌', 'Fermer', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  // ========== MODAL ==========

  voirDetails(permission: any): void {
    this.permissionSelectionnee = permission;
    this.showModal = true;
  }

  fermerModal(): void {
    this.showModal = false;
    this.permissionSelectionnee = null;
  }

  // ========== UTILITAIRES ==========

  getStatutLabel(statut: number): string {
    switch (statut) {
      case 1: return 'En attente';
      case 2: return 'Acceptée';
      case 3: return 'Refusée';
      default: return 'Inconnu';
    }
  }

  getStatutClass(statut: number): string {
    switch (statut) {
      case 1: return 'badge-warning';
      case 2: return 'badge-success';
      case 3: return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  calculerDuree(debut: string, fin: string): string {
    const dateDebut = new Date(debut);
    const dateFin = new Date(fin);
    const diffMs = Math.abs(dateFin.getTime() - dateDebut.getTime());
    const totalHeures = Math.floor(diffMs / (1000 * 60 * 60));
    const jours = Math.floor(totalHeures / 24);
    const heures = totalHeures % 24;
    const heuresFormattees = heures.toString().padStart(2, '0');
    return `${jours}j ${heuresFormattees}h`;
  }

  formatDateSort(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  // ========== GÉNÉRATION DU NOM DE FICHIER ==========

  private generateFileName(permission: any): string {
    const prenom = permission.employe?.prenom || 'inconnu';
    const nom = permission.employe?.nom || 'inconnu';

    const cleanName = (name: string) => {
      if (!name) return 'inconnu';
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    };

    const prenomFormatted = cleanName(prenom);
    const nomFormatted = cleanName(nom);

    const date = permission.date_demande ? new Date(permission.date_demande) : new Date();
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `permission_${prenomFormatted}_${nomFormatted}_du_${day}_${month}_${year}.pdf`;
  }

  // ========== GÉNÉRATION PDF ==========

  generatePdf(permission: any) {
    if (!permission) {
      this.snackbar.open('Permission invalide', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Logo
      try {
        const logo = new Image();
        logo.src = window.location.origin + '/assets/images/logo/logo-alerteInfo.png';
        logo.onload = () => {
          doc.addImage(logo, 'PNG', 14, 10, 40, 20);
          this.generatePdfContent(doc, permission, pageWidth, pageHeight);
        };
        logo.onerror = () => {
          this.generatePdfContent(doc, permission, pageWidth, pageHeight);
        };
      } catch (e) {
        this.generatePdfContent(doc, permission, pageWidth, pageHeight);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      this.snackbar.open('Erreur lors de la génération du PDF ❌', 'Fermer', { duration: 3000 });
    }
  }

  private generatePdfContent(doc: jsPDF, permission: any, pageWidth: number, pageHeight: number) {
    try {
      // Titre
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      const title = 'Détails de la demande de permission (ARCHIVÉE)';
      const textWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - textWidth) / 2, 30);

      let y = 45;
      const cardHeight = 55;

      // Carte informations
      doc.setFillColor(230, 240, 250);
      doc.roundedRect(10, y, pageWidth - 20, cardHeight, 3, 3, 'F');
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');

      doc.text(`Employé: ${permission.employe?.prenom || ''} ${permission.employe?.nom || ''}`, 14, y + 8);
      doc.text(`Fonction: ${permission.employe?.fonction?.nom || 'N/A'}`, 14, y + 16);
      doc.text(`Type: ${permission.type?.nom || 'N/A'}`, 14, y + 24);
      doc.text(`Date demande: ${this.formatDateSort(permission.date_demande)}`, 14, y + 32);

      doc.text(`Début: ${this.formatDateSort(permission.debut)}`, 110, y + 8);
      doc.text(`Fin: ${this.formatDateSort(permission.fin)}`, 110, y + 16);
      doc.text(`Durée: ${this.calculerDuree(permission.debut, permission.fin)}`, 110, y + 24);
      doc.text(`Statut: ${this.getStatutLabel(permission.statut)}`, 110, y + 32);

      if (permission.raison) {
        doc.text(`Raison: ${permission.raison.substring(0, 50)}${permission.raison.length > 50 ? '...' : ''}`, 14, y + 44);
      }

      if (permission.commentaire_admin) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Commentaire: ${permission.commentaire_admin}`, 14, y + 52);
        doc.setFont('helvetica', 'normal');
      }

      // Séparateur
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(10, y + cardHeight + 5, pageWidth - 10, y + cardHeight + 5);

      let currentY = y + cardHeight + 15;

      // Section Documents
      const documents = permission.documents || [];
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text(`Documents joints (${documents.length})`, 14, currentY);
      currentY += 8;

      if (documents.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        documents.forEach((docItem: any, index: number) => {
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentY = 20;
          }
          const type = this.isImageDocument(docItem) ? 'Image' :
                      this.isPdfDocument(docItem) ? 'PDF' :
                      docItem.extension?.toUpperCase() || 'Fichier';
          const size = this.formatFileSize(docItem.taille || 0);
          doc.text(`${index + 1}. ${docItem.nom_fichier || 'Sans nom'} (${type}) - ${size}`, 14, currentY);
          currentY += 7;
        });
      } else {
        doc.text('Aucun document joint', 14, currentY);
        currentY += 10;
      }

      // Date d'archivage
      if (permission.archive) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Archivé le: ${this.formatDateSort(permission.archive)}`, 14, currentY + 5);
      }

      // Pied de page
      const today = new Date();
      const dateStr = today.toLocaleDateString('fr-FR');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Généré le ${dateStr} - © ${today.getFullYear()} | ALERTE INFO`, 14, pageHeight - 10);

      // Sauvegarde avec nom personnalisé
      const fileName = this.generateFileName(permission);
      doc.save(fileName);

      this.snackbar.open(`PDF téléchargé avec succès ✅`, 'Fermer', { duration: 3000 });

    } catch (error) {
      console.error('Erreur lors de la génération du contenu PDF:', error);
      this.snackbar.open('Erreur lors de la génération du PDF ❌', 'Fermer', { duration: 3000 });
    }
  }

  // ========== NAVIGATION ==========

  goToListe() {
    this.router.navigate(['/permissions']);
  }
}
