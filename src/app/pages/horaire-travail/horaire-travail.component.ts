import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../material.module';
import { HoraireTravailService } from '../../services/horaire-travail.service';
import { AuthService } from '../../services/auth.service';
import { AccessDeniedComponent } from '../access-denied/access-denied.component';

interface JourHoraire {
  jour_semaine: number;
  nom: string;
  court: string;
  heure_debut: string;
  heure_fin: string;
  pause_debut: string | null;
  pause_fin: string | null;
  est_permanence: boolean;
  actif: boolean;
}

@Component({
  selector: 'app-horaire-travail',
  imports: [CommonModule, FormsModule, MaterialModule, AccessDeniedComponent],
  templateUrl: './horaire-travail.component.html',
  styleUrl: './horaire-travail.component.scss'
})
export class HoraireTravailComponent {

  isLoading = false;
  isSaving = false;

  services: any[] = [];
  serviceSelectionne: any = null;

  jours: JourHoraire[] = [];

  // Modal duplication
  showDuplicateModal = false;
  duplicateSource = '';
  duplicateCible = '';

  // Filtre de vue
  viewMode: 'cards' | 'compact' = 'cards';

  private readonly JOURS_DEFAUT = [
    { num: 1, nom: 'Lundi',    court: 'Lun' },
    { num: 2, nom: 'Mardi',    court: 'Mar' },
    { num: 3, nom: 'Mercredi', court: 'Mer' },
    { num: 4, nom: 'Jeudi',    court: 'Jeu' },
    { num: 5, nom: 'Vendredi', court: 'Ven' },
    { num: 6, nom: 'Samedi',   court: 'Sam' },
    { num: 7, nom: 'Dimanche', court: 'Dim' },
  ];

  constructor(
    private horaireSvr: HoraireTravailService,
    private snackBar: MatSnackBar,
    private authSvr: AuthService
  ) {}

  ngOnInit(): void {
    this.initialiserJours();
    this.chargerServices();
  }

  isEmploye(): boolean {
    return this.authSvr.isEmploye();
  }

  // ────────────────────────────────────────────
  // Chargement
  // ────────────────────────────────────────────

  chargerServices(): void {
    this.horaireSvr.getServices().subscribe({
      next: (res) => {
        if (res?.success) {
          this.services = res.data;
          if (this.services.length > 0) {
            this.selectionnerService(this.services[0]);
          }
        }
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message || 'Erreur lors du chargement des services',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  selectionnerService(service: any): void {
    this.serviceSelectionne = service;
    this.initialiserJours();
    this.chargerHoraires(service.slug);
  }

  chargerHoraires(serviceSlug: string): void {
    this.isLoading = true;
    this.horaireSvr.getAll().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!res?.success) return;

        const horaires = (res.data.horaires || []).filter(
          (h: any) => h.id_service === serviceSlug
        );

        this.jours = this.jours.map(jour => {
          const horairesJour = horaires.filter((h: any) => h.jour_semaine === jour.jour_semaine);
          if (horairesJour.length === 0) return jour;

          const h = horairesJour[0];
          return {
            ...jour,
            heure_debut:    this.toHHmm(h.heure_debut),
            heure_fin:      this.toHHmm(h.heure_fin),
            pause_debut:    h.pause_debut ? this.toHHmm(h.pause_debut) : null,
            pause_fin:      h.pause_fin   ? this.toHHmm(h.pause_fin)   : null,
            est_permanence: !!h.est_permanence,
            actif: true,
          };
        });
      },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des horaires', 'Fermer', { duration: 3000 });
      }
    });
  }

  // ────────────────────────────────────────────
  // Manipulation
  // ────────────────────────────────────────────

  private initialiserJours(): void {
    this.jours = this.JOURS_DEFAUT.map(j => ({
      jour_semaine:   j.num,
      nom:            j.nom,
      court:          j.court,
      heure_debut:    '08:00',
      heure_fin:      '18:00',
      pause_debut:    '12:30',
      pause_fin:      '14:30',
      est_permanence: false,
      actif:          false,
    }));
  }

  toggleJour(jour: JourHoraire): void {
    jour.actif = !jour.actif;
  }

  togglePause(jour: JourHoraire): void {
    if (jour.pause_debut && jour.pause_fin) {
      jour.pause_debut = null;
      jour.pause_fin = null;
    } else {
      jour.pause_debut = '12:30';
      jour.pause_fin = '14:30';
    }
  }

  estWeekend(jour: JourHoraire): boolean {
    return jour.jour_semaine >= 6;
  }

  compareServiceParSlug = (a: any, b: any): boolean => {
    return a?.slug === b?.slug;
  };

  /**
   * Copie les horaires du premier jour actif vers tous les autres jours actifs.
   */
  appliquerATous(): void {
    const reference = this.jours.find(j => j.actif);
    if (!reference) {
      this.snackBar.open('Activez au moins un jour pour servir de référence', 'Fermer', { duration: 3000 });
      return;
    }

    this.jours.forEach(j => {
      if (!j.actif) return;
      j.heure_debut = reference.heure_debut;
      j.heure_fin   = reference.heure_fin;
      j.pause_debut = reference.pause_debut;
      j.pause_fin   = reference.pause_fin;
    });

    this.snackBar.open('Horaires appliqués à tous les jours actifs', 'Fermer', { duration: 2000 });
  }

  // ────────────────────────────────────────────
  // Actions
  // ────────────────────────────────────────────

  enregistrer(): void {
    if (!this.serviceSelectionne) return;

    if (!this.jours.some(j => j.actif)) {
      this.snackBar.open('Veuillez activer au moins un jour', 'Fermer', { duration: 3000 });
      return;
    }

    for (const j of this.jours) {
      if (!j.actif) continue;
      if (j.heure_fin <= j.heure_debut) {
        this.snackBar.open(`${j.nom} : l'heure de fin doit être postérieure au début`, 'Fermer', { duration: 4000 });
        return;
      }
      if (j.pause_debut && j.pause_fin && j.pause_fin <= j.pause_debut) {
        this.snackBar.open(`${j.nom} : la pause est invalide`, 'Fermer', { duration: 4000 });
        return;
      }
    }

    this.isSaving = true;
    this.horaireSvr.save({
      id_service: this.serviceSelectionne.slug,
      horaires: this.jours.map(j => ({
        jour_semaine:   j.jour_semaine,
        heure_debut:    j.heure_debut,
        heure_fin:      j.heure_fin,
        pause_debut:    j.pause_debut,
        pause_fin:      j.pause_fin,
        est_permanence: j.est_permanence,
        actif:          j.actif,
      })),
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.snackBar.open(res.message || 'Horaires enregistrés avec succès', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de l\'enregistrement',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

  ouvrirDuplicateModal(): void {
    this.duplicateSource = this.serviceSelectionne?.slug || '';
    this.duplicateCible = '';
    this.showDuplicateModal = true;
  }

  fermerDuplicateModal(): void {
    this.showDuplicateModal = false;
    this.duplicateSource = '';
    this.duplicateCible = '';
  }

  dupliquer(): void {
    if (!this.duplicateSource || !this.duplicateCible) {
      this.snackBar.open('Sélectionnez les deux services', 'Fermer', { duration: 3000 });
      return;
    }
    if (this.duplicateSource === this.duplicateCible) {
      this.snackBar.open('Les services doivent être différents', 'Fermer', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    this.horaireSvr.duplicate({
      source: this.duplicateSource,
      cible: this.duplicateCible,
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.fermerDuplicateModal();
        this.snackBar.open(res.message || 'Horaires dupliqués', 'Fermer', { duration: 3000 });
        if (this.duplicateCible === this.serviceSelectionne?.slug) {
          this.chargerHoraires(this.serviceSelectionne.slug);
        }
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors de la duplication',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

  // ────────────────────────────────────────────
  // Helpers / Getters
  // ────────────────────────────────────────────

  private toHHmm(time: string): string {
    return time?.substring(0, 5) || '';
  }

  get resumeSemaine(): string {
    const joursActifs = this.jours.filter(j => j.actif);
    if (joursActifs.length === 0) return 'Aucun jour actif';
    if (joursActifs.length === 5 && !this.jours[5].actif && !this.jours[6].actif) {
      return 'Lundi → Vendredi';
    }
    return joursActifs.map(j => j.court).join(', ');
  }

  get totalHeuresSemaine(): string {
    let total = 0;
    for (const j of this.jours) {
      if (!j.actif) continue;
      const debut = this.timeEnMinutes(j.heure_debut);
      const fin = this.timeEnMinutes(j.heure_fin);
      let duree = fin - debut;

      if (j.pause_debut && j.pause_fin) {
        duree -= (this.timeEnMinutes(j.pause_fin) - this.timeEnMinutes(j.pause_debut));
      }

      total += Math.max(0, duree);
    }
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }

  get totalJoursActifs(): number {
    return this.jours.filter(j => j.actif).length;
  }

  get joursPermanence(): number {
    return this.jours.filter(j => j.actif && j.est_permanence).length;
  }

  getDureeJour(jour: JourHoraire): string {
    if (!jour.actif) return '—';
    const debut = this.timeEnMinutes(jour.heure_debut);
    const fin = this.timeEnMinutes(jour.heure_fin);
    let duree = fin - debut;
    if (jour.pause_debut && jour.pause_fin) {
      duree -= (this.timeEnMinutes(jour.pause_fin) - this.timeEnMinutes(jour.pause_debut));
    }
    if (duree <= 0) return '—';
    const h = Math.floor(duree / 60);
    const m = duree % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }

  private timeEnMinutes(t: string): number {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }
}