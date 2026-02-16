import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-details-permissions',
  imports: [CommonModule],
  templateUrl: './details-permissions.component.html',
  styleUrl: './details-permissions.component.scss',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class DetailsPermissionsComponent {
  @Input() permission!: any;
  @Output() close = new EventEmitter<void>();
  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '';

    // Détecter si une heure existe dans la string
    const hasTime = dateStr.includes(':');

    // Réparer le format pour JS
    let fixed = hasTime
      ? dateStr.replace(' ', 'T') + 'Z'
      : dateStr + 'T00:00:00Z';

    const d = new Date(fixed);

    if (isNaN(d.getTime())) return '';

    // Choisir le format selon présence d’heure
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(hasTime && {
        hour: '2-digit',
        minute: '2-digit'
      })
    });
  }



  getStatutBadge(status:number):string{
    switch(status){
      case 1: return "badge rounded-pill bg-warning text-dark";
      case 2: return "badge rounded-pill bg-success";
      case 3: return "badge rounded-pill bg-danger";
      default: return "badge rounded-pill bg-secondary";
    }
  }
  getStatutLabel(status:number){
    switch(status){
      case 1: return 'En attente'
      case 2: return 'Acceptée'
      case 3: return 'Refusée'
      default: return 'Inconnu'
    }
  }
  getDuration(permission: any): number {
    const start = new Date(permission.startDate);
    const end = new Date(permission.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  closeDetails() {
    this.close.emit(); // émet l'événement au parent
  }
}
