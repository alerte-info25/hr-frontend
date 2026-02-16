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
// import Swal from 'sweetalert2';

declare var bootstrap: any;

@Component({
  selector: 'app-permis',
  imports: [CommonModule, FormsModule, ReactiveFormsModule,MaterialModule,],
  templateUrl: './permis.component.html',
  styleUrl: './permis.component.scss',
})
export class PermisComponent {
  permissionsEnAttente: any[] = [];
  toutesPermissions: any[] = [];
  typesPermission: any[] = [];
  // Pagination
  // Pagination permissions en attente
  currentPageAttente = 1;
  perPageAttente = 5;
  totalAttente = 0;

  // Pagination toutes permissions
  currentPageToutes = 1;
  perPageToutes = 10;
  totalToutes = 0;


  // Modal de réponse
  showModal: boolean = false;
  permissionSelectionnee: any | null = null;
  commentaireAdmin: string = '';
  actionEnCours: 'accepter' | 'refuser' | null = null;

  // Loading states
  isLoadingEnAttente: boolean = false;
  isLoadingToutes: boolean = false;
  isSubmitting: boolean = false;

  // Messages
  messageSucces: string = '';
  messageErreur: string = '';

  // Filtres et recherche
  searchQuery = '';
  selectedStatus: number | null = null;
  selectedType: string | null = null;

  constructor(
    private permissionService: PermissionService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private router: Router,
    private typePermissionService: TypePermissionsService
  ) {}

  ngOnInit(): void {
    this.chargerToutesPermissions();
    this.loadTypesPermission();
  }
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

  get filteredPermissions(): any[] {
    return this.toutesPermissions.filter(perm => {
      const matchesSearch = !this.searchQuery ||
        perm.raison.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.type?.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.employe?.nom.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        perm.employe?.prenom.toLowerCase().includes(this.searchQuery.toLowerCase());
        perm.employe?.fonction?.nom.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = this.selectedStatus === null || perm.statut === this.selectedStatus;
      const matchesType = !this.selectedType || perm.id_type === this.selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedType = null;
    // this.currentPage = 1;
  }

  loadTypesPermission(): void {
    // TODO: Appel au service Angular
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

  // Charger toutes les permissions avec pagination
  chargerToutesPermissions(): void {
    this.isLoadingToutes = true;
    this.permissionService.getList().subscribe({
      next: (response) => {
        this.isLoadingToutes = false;
        this.toutesPermissions = response;
        this.permissionsEnAttente = this.toutesPermissions.filter(p => p.statut === 1);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des permissions:', error);
        this.afficherErreur('Erreur lors du chargement des permissions');
        this.isLoadingToutes = false;
      }
    });
  }

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

  // Ouvrir le modal pour voir et répondre
  ouvrirModal(permission: any) {
    this.dialog.open(PermissionDetailDialogComponent, {
      width: '2000px',
      data: permission,
      disableClose: true
    });
  }

  voirDetails(permission: any): void {
    this.permissionSelectionnee = permission;
    this.showModal = true;
  }


  // Fermer le modal
  fermerModal(): void {
    this.showModal = false;
    this.permissionSelectionnee = null;
    this.commentaireAdmin = '';

  }

  // Soumettre la réponse (accepter ou refuser)
  soumettreReponse(): void {
    if (!this.permissionSelectionnee || !this.actionEnCours) return;

    // Validation du commentaire pour le refus
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


  // Helpers pour l'affichage
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

  // Messages
  afficherSucces(message: string): void {
    this.messageSucces = message;
    setTimeout(() => this.messageSucces = '', 5000);
  }

  afficherErreur(message: string): void {
    this.messageErreur = message;
    setTimeout(() => this.messageErreur = '', 5000);
  }

  // Pagination
  // ===== PAGINATION EN ATTENTE =====
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

  // ===== PAGINATION TOUTES PERMISSIONS =====
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
  onFilterChange(): void {
    this.currentPageToutes = 1;
  }



  generatePdf(permission: any) {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // === Logo en haut à gauche ===
    const logo = new Image();
    logo.src = window.location.origin + '/assets/images/logo/logo-alerteInfo.png';
    logo.onload = () => {
      doc.addImage(logo, 'PNG', 14, 10, 40, 20);

      // === Titre centré ===
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 128, 185); // bleu
      const title = 'Détails de la demande de permission';
      const textWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - textWidth) / 2, 20);

      // === Bloc infos employé stylé ===
      let y = 35;
      const cardHeight = 50;
      doc.setFillColor(230, 240, 250); // léger bleu
      doc.roundedRect(10, y, pageWidth - 20, cardHeight, 3, 3, 'F');

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');

      doc.text(`Employé: ${permission.employe?.nom} ${permission.employe?.prenom}`, 14, y + 8);
      doc.text(`Fonction: ${permission.employe?.fonction?.nom}`, 14, y + 16);
      doc.text(`Type: ${permission.type.nom}`, 14, y + 24);
      doc.text(`Date demande: ${permission.date_demande}`, 14, y + 32);
      doc.text(`Début: ${permission.debut}`, 110, y + 8);
      doc.text(`Fin: ${permission.fin}`, 110, y + 16);
      doc.text(`Raison: ${permission.raison}`, 110, y + 24);

      if (permission.date_reponse) {
        doc.text(`Date réponse: ${permission.date_reponse}`, 110, y + 32);
      }
      if (permission.commentaire_admin) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Commentaire admin: ${permission.commentaire_admin}`, 14, y + 44);
        doc.setFont('helvetica', 'normal');
      }

      // === Séparateur ===
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.line(10, y + cardHeight + 5, pageWidth - 10, y + cardHeight + 5);

      // === Table AutoTable compacte ===
      autoTable(doc, {
        startY: y + cardHeight + 10,
        head: [['Statut', 'Document']],
        body: [[
          this.getStatutLabel(permission.statut),
          permission.document ? 'Oui' : 'Non'
        ]],
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { fillColor: [245, 245, 245], textColor: 0 },
        alternateRowStyles: { fillColor: [230, 230, 230] },
        margin: { left: 14, right: 14 }
      });

      // === Footer discret ===
      const pageHeight = doc.internal.pageSize.height;
      const today = new Date();
      const dateStr = today.toLocaleDateString();
      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Généré le ${dateStr} - © 2025 | ALERTE INFO`, 14, pageHeight - 10);

      // === Téléchargement ===
      doc.save(`permission_${permission.slug}.pdf`);
    };
  }

  goToArchive() {
    this.router.navigate(['/permissions-archive']);
  }
  goToPermissionsUser() {
    this.router.navigate(['/mes-permissions']);
  }

}
