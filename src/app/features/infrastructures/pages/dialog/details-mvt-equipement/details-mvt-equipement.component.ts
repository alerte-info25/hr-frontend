import { MaterialModule } from './../../../../../../../material.module';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-details-mvt-equipement',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './details-mvt-equipement.component.html',
  styleUrl: './details-mvt-equipement.component.scss'
})
export class DetailsMvtEquipementComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetailsMvtEquipementComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'sortie_terrain': 'logout',
      'retour_terrain': 'login',
      'transfert': 'swap_horiz',
      'mise_en_maintenance': 'build',
      'reforme': 'delete_forever'
    };
    return icons[type] || 'help';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'sortie_terrain': 'Sortie terrain',
      'retour_terrain': 'Retour terrain',
      'transfert': 'Transfert',
      'mise_en_maintenance': 'Maintenance',
      'reforme': 'Hors service'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'sortie_terrain': 'type-sortie',
      'retour_terrain': 'type-retour',
      'transfert': 'type-transfert',
      'mise_en_maintenance': 'type-maintenance',
      'reforme': 'type-reforme'
    };
    return classes[type] || '';
  }

  formatDateTime(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
