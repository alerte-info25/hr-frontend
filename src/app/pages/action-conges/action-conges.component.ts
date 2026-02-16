import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CongesService } from '../../services/conges.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-action-conges',
  imports: [FormsModule, CommonModule, LoadingComponent],
  templateUrl: './action-conges.component.html',
  styleUrl: './action-conges.component.scss',
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
export class ActionCongesComponent {
  decision: number | null = null; // 2 = accepté, 3 = refusé
  commentaireAdmin: string = '';
  isLoading :boolean = false;
  @Input() conge!: any;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }
  constructor(
    private congesSvr: CongesService
  ){  }

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

  validerDecision(slug: string) {
    if (!this.decision) return;
      this.isLoading = true;
    const payload = {
      statut: this.decision,
      commentaire_admin: this.commentaireAdmin,
      // date_reponse: new Date()
    };
    this.congesSvr.responseConge(slug, payload).subscribe({
      next: (res) => {
        this.isLoading =false
        this.updated.emit();
        this.closeDetails(); // ferme après validation
      },
      error: (err) => {
        this.isLoading =false
        console.error('Erreur lors de l\'envoie de la reponse', err);
      }
    });
  }
  isLocked(dateDebut: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const debut = new Date(dateDebut);
    debut.setHours(0, 0, 0, 0);

    return debut < today;
  }
  changerStatut(demande: any, status: 2 | 3) {
    demande.status = status;
  }
}
