import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PermissionService } from '../../services/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
    private snackBar: MatSnackBar
  ) {}

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
      motif: motif
    }).subscribe({
      next: () => {
        this.snackBar.open('Demande mise à jour', 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur serveur', 'Fermer', { duration: 3000 });
      }
    });
  }

  fermer() {
    this.dialogRef.close();
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

}
