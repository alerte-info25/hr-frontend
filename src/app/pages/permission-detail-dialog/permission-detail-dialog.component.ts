import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PermissionService } from '../../services/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-permission-detail-dialog',
  imports: [FormsModule, CommonModule],
  templateUrl: './permission-detail-dialog.component.html',
  styleUrl: './permission-detail-dialog.component.scss'
})
export class PermissionDetailDialogComponent {
  motifRefus = '';
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public permission: any,
    private dialogRef: MatDialogRef<PermissionDetailDialogComponent>,
    private permissionService: PermissionService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  // ========== DÉCISION ==========

  accepter() {
    this.updateStatus(2);
  }

  refuser() {
    if (!this.motifRefus.trim()) {
      this.snackBar.open('Motif obligatoire', 'Fermer', { duration: 3000 });
      return;
    }
    this.updateStatus(3, this.motifRefus);
  }

  updateStatus(status: number, motif: string | null = null) {
    this.loading = true;
    this.permissionService.responsePermission(this.permission.slug, {
      statut: status,
      commentaire_admin: motif,
      date_reponse: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.snackBar.open('Demande mise à jour avec succès ✅', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Erreur serveur', 'Fermer', { duration: 3000 });
      }
    });
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
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

  fermer() {
    this.dialogRef.close();
  }
}
