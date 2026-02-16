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

@Component({
  selector: 'app-permission-archive',
  imports: [CommonModule, FormsModule, ReactiveFormsModule,MaterialModule],
  templateUrl: './permission-archive.component.html',
  styleUrl: './permission-archive.component.scss'
})
export class PermissionArchiveComponent {
  // Pagination toutes permissions
  currentPageToutes = 1;
  perPageToutes = 10;
  totalToutes = 0;
  toutesPermissions: any[] = [];
  isLoadingToutes: boolean = true;

  isSubmitting: boolean = false;

  showModal: boolean = false;
  permissionSelectionnee: any | null = null;
  constructor(
    private permissionService: PermissionService,
    private dialog: MatDialog,
    private snackbar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.chargerToutesPermissions();
  }

  // Charger toutes les permissions avec pagination
  chargerToutesPermissions(): void {
    this.isLoadingToutes = true;
    this.permissionService.getListPermissionArchiver().subscribe({
      next: (response) => {
        this.isLoadingToutes = false;
        this.toutesPermissions = response;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des permissions:', error);
        this.snackbar.open(error.error.message || 'Erreur lors du chargement des permissions','Fermer',{duration:4000});
        this.isLoadingToutes = false;
      }
    });
  }

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

  voirDetails(permission: any): void {
    this.permissionSelectionnee = permission;
    this.showModal = true;
  }


  // Fermer le modal
  fermerModal(): void {
    this.showModal = false;
    this.permissionSelectionnee = null;
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

  get paginatedToutesPermissions() {
    const start = (this.currentPageToutes - 1) * this.perPageToutes;
    return this.toutesPermissions.slice(start, start + this.perPageToutes);
  }

  get totalPagesToutes(): number {
    return Math.ceil(this.toutesPermissions.length / this.perPageToutes);
  }

  changerPageToutes(page: number) {
    if (page >= 1 && page <= this.totalPagesToutes) {
      this.currentPageToutes = page;
    }
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

    desarchiverPermission(permission: any): void {
      if (!permission) return;
      this.isSubmitting = true;

      this.permissionService.desarchivePermission(permission.slug).subscribe({
        next: (res) => {
          this.snackbar.open(res.message || 'Permission désarchivée avec succès', 'Fermer', { duration: 3000 });
          this.chargerToutesPermissions();
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Erreur lors du désarchivage:', err);
          this.snackbar.open(err.error.message || 'Erreur lors du désarchivage de la permission', 'Fermer', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    }

    goToListe(){
      this.router.navigate(['/permissions']);
    }

}
