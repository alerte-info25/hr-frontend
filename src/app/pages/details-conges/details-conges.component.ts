import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-details-conges',
  imports: [CommonModule],
  templateUrl: './details-conges.component.html',
  styleUrl: './details-conges.component.scss',
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
export class DetailsCongesComponent {
  @Input() conge!: any;
  @Output() close = new EventEmitter<void>();
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
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
  getDuration(conge: any): number {
    const start = new Date(conge.startDate);
    const end = new Date(conge.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
  closeDetails() {
    this.close.emit(); // émet l'événement au parent
  }
}
