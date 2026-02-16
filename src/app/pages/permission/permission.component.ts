import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../services/permission.service';
import { LoadingComponent } from '../loading/loading.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-permission',
  imports: [CommonModule, FormsModule, LoadingComponent],
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.scss',
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
export class PermissionComponent {
  load = false
  decision: number | null = null; // 2 = accepté, 3 = refusé
  commentaireAdmin: string = '';
  isLoading :boolean = false;
  @Input() permission!: any;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();
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


  constructor(
    private permisSvr: PermissionService,
    private snackBar: MatSnackBar
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
    this.load = true;
    const payload = {
      statut: this.decision,
      commentaire_admin: this.commentaireAdmin,
      // date_reponse: new Date()
    };
    this.permisSvr.responsePermission(slug, payload).subscribe({
      next: (res) => {
        this.load =false
        this.updated.emit();
        this.closeDetails();
        this.decision = null;
        this.commentaireAdmin = '';
        this.close.emit();
        this.snackBar.open(res.message || 'Reponse envoyé','Fermer',{
          duration:3000,
        })
      },
      error: (err) => {
        this.load =false
        this.snackBar.open(err.error.message || 'Une erreur s\'est produite','Fermer',{
          duration:3000,
        })
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
  ngOnDestroy(){
    this.permission = undefined
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['permission']) {
      // Quand une nouvelle permission arrive → reset du formulaire
      this.decision = null;
      this.commentaireAdmin = '';
    }
  }
}


