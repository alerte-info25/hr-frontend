import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PermissionService } from '../../services/permission.service';
import { PermissionDetailDialogComponent } from '../permission-detail-dialog/permission-detail-dialog.component';
import { MaterialModule } from '../../../../material.module';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TypePermissionsService } from '../../services/type-permissions.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DurationCalculatorService } from '../../services/duration-calculator.service';

declare var bootstrap: any;

@Component({
  selector: 'app-permis',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './permis.component.html',
  styleUrl: './permis.component.scss',
})
export class PermisComponent implements OnInit {
  permissionsEnAttente: any[] = [];
  toutesPermissions1: any[] = [];
  toutesPermissions: any[] = [];
  typesPermission: any[] = [];
  currentPageAttente = 1;
  perPageAttente = 5;
  totalAttente = 0;
  currentPageToutes = 1;
  perPageToutes = 10;
  totalToutes = 0;
  showModal: boolean = false;
  permissionSelectionnee: any | null = null;
  commentaireAdmin: string = '';
  actionEnCours: 'accepter' | 'refuser' | null = null;
  isLoadingEnAttente: boolean = false;
  isLoadingToutes: boolean = false;
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  messageSucces: string = '';
  messageErreur: string = '';
  searchQuery = '';
  selectedStatus: number | null = null;
  selectedType: string | null = null;

  constructor(
    private permissionService: PermissionService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private router: Router,
    private typePermissionService: TypePermissionsService,
    private sanitizer: DomSanitizer,
    private durationCalculator: DurationCalculatorService
  ) {}

  ngOnInit(): void {
    this.chargerToutesPermissions();
    this.loadTypesPermission();
  }

  // ========== STATISTIQUES ==========

  get totalDemandes(): number {
    return this.toutesPermissions.length;
  }

  get totalEnAttente(): number {
    return this.toutesPermissions.filter(p => p.statut === 1).length;
  }

  get totalAcceptees(): number {
    return this.toutesPermissions.filter(p => p.statut === 2).length;
  }

  get totalRefusees(): number {
    return this.toutesPermissions.filter(p => p.statut === 3).length;
  }

  // ========== CHARGEMENT DES DONNÉES ==========

  loadTypesPermission(): void {
    this.typePermissionService.getList().subscribe({
      next: (data) => {
        this.typesPermission = data;
      },
      error: (err) => {
        this.snackbar.open(err.error.message || 'Erreur lors du chargement des types de permission', 'Fermer', { duration: 3000 });
        console.error(err);
      }
    });
  }

  chargerToutesPermissions(): void {
    this.isLoadingToutes = true;
    this.permissionService.getList().subscribe({
      next: (response) => {
        this.isLoadingToutes = false;
        this.toutesPermissions1 = response;
        this.toutesPermissions = this.toutesPermissions1.filter(p => p.statut !== 1);
        this.permissionsEnAttente = this.toutesPermissions1.filter(p => p.statut === 1);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des permissions:', error);
        this.afficherErreur('Erreur lors du chargement des permissions');
        this.isLoadingToutes = false;
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
        perm.employe?.prenom?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.employe?.fonction?.nom?.toLowerCase().includes(this.searchQuery.toLowerCase());

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

  get paginatedPermissionsEnAttente() {
    const start = (this.currentPageAttente - 1) * this.perPageAttente;
    return this.permissionsEnAttente.slice(start, start + this.perPageAttente);
  }

  get totalPagesAttente(): number {
    return Math.ceil(this.permissionsEnAttente.length / this.perPageAttente);
  }

  changerPageAttente(page: number) {
    if (page >= 1 && page <= this.totalPagesAttente) {
      this.currentPageAttente = page;
    }
  }

  get paginatedToutesPermissions(): any[] {
    const start = (this.currentPageToutes - 1) * this.perPageToutes;
    return this.filteredPermissions.slice(start, start + this.perPageToutes);
  }

  get totalPagesToutes(): number {
    return Math.ceil(this.filteredPermissions.length / this.perPageToutes);
  }

  changerPageToutes(page: number): void {
    if (page >= 1 && page <= this.totalPagesToutes) {
      this.currentPageToutes = page;
    }
  }

  // ========== GESTION DES PERMISSIONS ==========

  archiverPermission(permission: any): void {
    if (!permission) return;
    this.isSubmitting = true;
    this.permissionService.archivePermission(permission.slug).subscribe({
      next: (res) => {
        this.snackbar.open(res.message || 'Permission archivée avec succès', 'Fermer', { duration: 3000 });
        this.chargerToutesPermissions();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur lors de l\'archivage:', err);
        this.snackbar.open(err.error.message || 'Erreur lors de l\'archivage de la permission', 'Fermer', { duration: 3000 });
        this.isSubmitting = false;
      }
    });
  }

  ouvrirModal(permission: any) {
    const dialogRef = this.dialog.open(PermissionDetailDialogComponent, {
      width: '900px',
      data: permission,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.chargerToutesPermissions();
      }
    });
  }

  voirDetails(permission: any): void {
    this.permissionSelectionnee = permission;
    this.showModal = true;
  }

  fermerModal(): void {
    this.showModal = false;
    this.permissionSelectionnee = null;
    this.commentaireAdmin = '';
    this.actionEnCours = null;
  }

  soumettreReponse(): void {
    if (!this.permissionSelectionnee || !this.actionEnCours) return;

    if (this.actionEnCours === 'refuser' && !this.commentaireAdmin.trim()) {
      this.afficherErreur('Un commentaire est obligatoire pour refuser une demande');
      return;
    }

    this.isSubmitting = true;
    const statut = this.actionEnCours === 'accepter' ? 2 : 3;
    const data = {
      statut: statut,
      commentaire_admin: this.commentaireAdmin.trim(),
      date_reponse: new Date().toISOString()
    };

    this.permissionService.responsePermission(this.permissionSelectionnee.slug, data).subscribe({
      next: (response) => {
        const action = this.actionEnCours === 'accepter' ? 'acceptée' : 'refusée';
        this.afficherSucces(`Demande ${action} avec succès`);
        this.fermerModal();
        this.chargerToutesPermissions();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Erreur lors de la réponse:', error);
        this.afficherErreur('Erreur lors de la soumission de la réponse');
        this.isSubmitting = false;
      }
    });
  }

  getDocumentUrl(doc: any): string {
    if (!doc || !doc.url) {
      return '#';
    }
    // Si l'URL est déjà complète
    if (doc.url.startsWith('http://') || doc.url.startsWith('https://')) {
      return doc.url;
    }
    // Si l'URL commence par /storage/
    if (doc.url.startsWith('/storage/')) {
      return doc.url;
    }
    // Si c'est un chemin relatif
    if (doc.url.startsWith('storage/')) {
      return '/' + doc.url;
    }
    // Si c'est juste un chemin
    if (!doc.url.startsWith('/') && !doc.url.startsWith('http')) {
      return '/storage/' + doc.url;
    }
    return doc.url;
  }

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

  getFileExtensionLabel(doc: any): string {
    if (this.isImageDocument(doc)) {
      return 'Image';
    }
    if (this.isPdfDocument(doc)) {
      return 'PDF';
    }
    return doc.extension?.toUpperCase() || 'Fichier';
  }

  getSafeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
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

  // calculerDuree(debut: string, fin: string): string {
  //   const dateDebut = new Date(debut);
  //   const dateFin = new Date(fin);
  //   const diffMs = Math.abs(dateFin.getTime() - dateDebut.getTime());
  //   const totalHeures = Math.floor(diffMs / (1000 * 60 * 60));
  //   const jours = Math.floor(totalHeures / 24);
  //   const heures = totalHeures % 24;
  //   const heuresFormattees = heures.toString().padStart(2, '0');
  //   return `${jours}j ${heuresFormattees}h`;
  // }

  calculerDuree(debut: string, fin: string): string {
    return this.durationCalculator.formaterDuree(
      this.durationCalculator.calculerDureeOuvrable(debut, fin)
    );
  }

  calculerDureeLongue(debut: string, fin: string): string {
    return this.durationCalculator.formaterDureeLongue(
      this.durationCalculator.calculerDureeOuvrable(debut, fin)
    );
  }

  getDureeEnHeures(debut: string, fin: string): number {
    return this.durationCalculator.calculerDureeOuvrable(debut, fin);
  }

  getJoursOuvrables(debut: string, fin: string): number {
    return this.durationCalculator.compterJoursOuvrables(debut, fin);
  }

  getDetailDuree(debut: string, fin: string) {
    return this.durationCalculator.getDetailDuree(debut, fin);
  }

  getResumeDuree(debut: string, fin: string) {
    return this.durationCalculator.getResumeDuree(debut, fin);
  }

  formaterDuree(heures: number): string {
    return this.durationCalculator.formaterDuree(heures);
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

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  afficherSucces(message: string): void {
    this.messageSucces = message;
    setTimeout(() => this.messageSucces = '', 5000);
  }

  afficherErreur(message: string): void {
    this.messageErreur = message;
    setTimeout(() => this.messageErreur = '', 5000);
  }

  // ========== NAVIGATION ==========

  goToArchive() {
    this.router.navigate(['/permissions-archive']);
  }

  goToPermissionsUser() {
    this.router.navigate(['/mes-permissions']);
  }

  // ========== GÉNÉRATION PDF ==========

  // ========== GÉNÉRATION PDF AVEC GESTION D'ERREURS ==========

  async generatePdf(permission: any) {
    if (!permission) {
      this.snackbar.open('Permission invalide', 'Fermer', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Ajouter le logo si disponible
      try {
        const logoUrl = window.location.origin + '/assets/images/logo/logo-alerteInfo.png';
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              doc.addImage(e.target.result as string, 'PNG', 14, 8, 35, 18);
            }
            this.generatePdfContent(doc, permission, pageWidth, pageHeight);
          };
          reader.readAsDataURL(logoBlob);
        } else {
          this.generatePdfContent(doc, permission, pageWidth, pageHeight);
        }
      } catch (e) {
        this.generatePdfContent(doc, permission, pageWidth, pageHeight);
      }

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      this.snackbar.open('Erreur lors de la génération du PDF ❌', 'Fermer', { duration: 3000 });
      this.isLoading = false;
    }
  }

  private generatePdfContent(doc: jsPDF, permission: any, pageWidth: number, pageHeight: number) {
    try {
      // Titre
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185);
      doc.text('DEMANDE DE PERMISSION', pageWidth / 2, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');

      let y = 40;
      const lineHeight = 7;
      const leftMargin = 14;
      const rightColX = 120;

      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(leftMargin, y, pageWidth - leftMargin, y);
      y += 5;

      // Informations
      const infoData = [
        ['Employé', `${permission.employe?.prenom || ''} ${permission.employe?.nom || ''}`],
        ['Fonction', permission.employe?.fonction?.nom || 'N/A'],
        ['Type', permission.type?.nom || 'N/A'],
        ['Date demande', this.formatDateSort(permission.date_demande)],
        ['Début', this.formatDateSort(permission.debut)],
        ['Fin', this.formatDateSort(permission.fin)],
        ['Durée', this.calculerDuree(permission.debut, permission.fin)],
        ['Statut', this.getStatutLabel(permission.statut)],
      ];

      infoData.forEach(([label, value], index) => {
        const x = index < 4 ? leftMargin : rightColX;
        const row = index < 4 ? index : index - 4;
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, x, y + row * lineHeight);
        doc.setFont('helvetica', 'normal');
        doc.text(value.toString(), x + 40, y + row * lineHeight);
      });

      y += 4 * lineHeight + 8;

      // Raison
      if (permission.raison) {
        doc.setFont('helvetica', 'bold');
        doc.text('Raison:', leftMargin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const raisonLines = doc.splitTextToSize(permission.raison, pageWidth - 28);
        doc.text(raisonLines, leftMargin, y);
        y += raisonLines.length * 5 + 8;
      }

      // Commentaire
      if (permission.commentaire_admin) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Commentaire de l\'administrateur:', leftMargin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const commentLines = doc.splitTextToSize(permission.commentaire_admin, pageWidth - 28);
        doc.text(commentLines, leftMargin, y);
        y += commentLines.length * 5 + 8;
      }

      // Documents
      const documents = permission.documents || [];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Documents joints (${documents.length})`, leftMargin, y);
      y += 6;

      if (documents.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        documents.forEach((docItem: any, index: number) => {
          const type = this.isImageDocument(docItem) ? 'Image' :
                      this.isPdfDocument(docItem) ? 'PDF' : 'Fichier';
          const size = this.formatFileSize(docItem.taille || 0);
          const text = `${index + 1}. ${docItem.nom_fichier || 'Sans nom'} (${type}) - ${size}`;
          doc.text(text, leftMargin, y);
          y += 5;
        });
      } else {
        doc.text('Aucun document joint', leftMargin, y);
        y += 5;
      }

      // Pied de page
      const dateStr = new Date().toLocaleDateString('fr-FR');
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Généré le ${dateStr}`, leftMargin, pageHeight - 10);
      doc.text('ALERTE INFO - Tous droits réservés', pageWidth - leftMargin, pageHeight - 10, { align: 'right' });

      const fileName = this.generateFileName(permission);

      doc.save(fileName);
      // doc.save(`permission_${permission.slug || 'download'}.pdf`);

      this.snackbar.open('PDF téléchargé avec succès ✅', 'Fermer', { duration: 3000 });
      this.isLoading = false;

    } catch (error) {
      console.error('Erreur lors de la génération du contenu PDF:', error);
      this.snackbar.open('Erreur lors de la génération du PDF ❌', 'Fermer', { duration: 3000 });
      this.isLoading = false;
    }
  }

  private generateFileName(permission: any): string {
    const prenom = permission.employe?.prenom || 'inconnu';
    const nom = permission.employe?.nom || 'inconnu';

    // Nettoyer les noms (minuscules, sans accents, remplacement des espaces)
    const cleanName = (name: string) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]/g, '_') // Remplace tout caractère spécial par _
        .replace(/_+/g, '_') // Supprime les _ multiples
        .replace(/^_|_$/g, ''); // Supprime les _ en début/fin
    };

    const prenomFormatted = cleanName(prenom);
    const nomFormatted = cleanName(nom);

    // Formater la date
    const date = permission.date_demande ? new Date(permission.date_demande) : new Date();
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `permission_${prenomFormatted}_${nomFormatted}_du_${day}_${month}_${year}.pdf`;
  }

}
