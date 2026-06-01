import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-details-equipement',
  imports: [CommonModule],
  templateUrl: './details-equipement.component.html',
  styleUrl: './details-equipement.component.scss',
  animations: [
    trigger('dialogAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95) translateY(20px)' }))
      ])
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class DetailsEquipementComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<DetailsEquipementComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }

  getEtatLabel(etat: string) {
    const map: any = {
      neuf: 'Neuf',
      bon_etat: 'Bon état',
      usage: 'En usage',
      en_panne: 'En panne',
      en_maintenance: 'En maintenance',
      reforme: 'Hors service'
    };
    return map[etat] || etat;
  }

  getEtatIcon(etat: string) {
    const icons: any = {
      neuf: 'fiber_new',
      bon_etat: 'check_circle',
      usage: 'device_unknown',
      en_panne: 'error',
      en_maintenance: 'build',
      reforme: 'delete'
    };
    return icons[etat] || 'help';
  }

  // Nouvelle méthode pour obtenir le nom complet du dernier responsable
  getDernierResponsableNom(): string {
    if (this.data.dernier_responsable) {
      const responsable = this.data.dernier_responsable;
      return `${responsable.prenom || ''} ${responsable.nom || ''}`.trim() || 'Non défini';
    }
    return 'Non défini';
  }

  // Nouvelle méthode pour obtenir la date d'affectation du dernier responsable
  getDerniereAffectationDate(): string {
    if (this.data.affectation_active && this.data.affectation_active.date_affectation) {
      return this.formatDate(this.data.affectation_active.date_affectation);
    }
    return 'Aucune affectation';
  }

  getIconByCategorieName(catecorie:string){
    switch(catecorie.toLocaleLowerCase()){
      case 'mobilier':
        return 'chair'
      case 'electronique':
        return 'devices'
      default:
        return 'category'
    }
  }

  // Méthode de formatage de date
  formatDate(date: string): string {
    if (!date) return 'Non définie';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';

    const dateStr = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} à ${timeStr}`;
  }

  // Vérifier si l'équipement a un responsable
  hasDernierResponsable(): boolean {
    return !!this.data.dernier_responsable &&
           !!this.data.dernier_responsable.nom;
  }

  // Obtenir le matricule du responsable
  getDernierResponsableMatricule(): string {
    if (this.data.dernier_responsable && this.data.dernier_responsable.matricule) {
      return this.data.dernier_responsable.matricule;
    }
    return 'Non défini';
  }
}
