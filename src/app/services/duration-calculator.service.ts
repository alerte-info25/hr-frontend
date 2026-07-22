// duration-calculator.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DurationCalculatorService {

  // Heures de travail
  private readonly WORK_START_HOUR = 8;
  private readonly WORK_END_HOUR = 18;
  private readonly WORK_START_MINUTE = 0;
  private readonly WORK_END_MINUTE = 0;

  // Heures de pause
  private readonly PAUSE_START_HOUR = 12;
  private readonly PAUSE_START_MINUTE = 30;
  private readonly PAUSE_END_HOUR = 14;
  private readonly PAUSE_END_MINUTE = 30;

  // Heures effectives par jour (10h - 2h de pause)
  private readonly HEURES_EFFECTIVES_PAR_JOUR = 8;

  constructor() { }

  /**
   * Parse une date au format "YYYY-MM-DD HH:mm:ss"
   */
  private parseDate(dateStr: string): Date {
    const isoStr = dateStr.replace(' ', 'T');
    return new Date(isoStr);
  }

  /**
   * Calcule la durée en heures ouvrables entre deux datetime
   * @param debut DateTime de début (ex: "2026-07-24 06:00:00")
   * @param fin DateTime de fin (ex: "2026-07-26 20:00:00")
   * @returns Durée en heures (décimal)
   */
  calculerDureeOuvrable(debut: string | Date, fin: string | Date): number {
    const dateDebut = typeof debut === 'string' ? this.parseDate(debut) : new Date(debut);
    const dateFin = typeof fin === 'string' ? this.parseDate(fin) : new Date(fin);

    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime()) || dateDebut >= dateFin) {
      return 0;
    }

    let totalHeures = 0;
    let dateCourante = this.ajusterDebut(dateDebut);
    let dateFinAjustee = this.ajusterFin(dateFin);

    if (dateCourante >= dateFinAjustee) {
      return 0;
    }

    while (dateCourante < dateFinAjustee) {
      // Si weekend, passer au lundi suivant à 8h
      if (this.estWeekend(dateCourante)) {
        dateCourante = this.getProchainLundi(dateCourante);
        dateCourante.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);
        continue;
      }

      const finJour = new Date(dateCourante);
      finJour.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);

      if (dateCourante >= finJour) {
        dateCourante = new Date(dateCourante);
        dateCourante.setDate(dateCourante.getDate() + 1);
        dateCourante.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);
        continue;
      }

      if (dateFinAjustee <= finJour) {
        totalHeures += this.calculerHeuresAvecPause(dateCourante, dateFinAjustee);
        break;
      }

      totalHeures += this.calculerHeuresAvecPause(dateCourante, finJour);

      dateCourante = new Date(dateCourante);
      dateCourante.setDate(dateCourante.getDate() + 1);
      dateCourante.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);
    }

    return Math.round(totalHeures * 100) / 100;
  }

  /**
   * Calcule les heures entre deux dates en excluant la pause
   */
  private calculerHeuresAvecPause(debut: Date, fin: Date): number {
    let totalMinutes = 0;
    let dateCourante = new Date(debut);

    while (dateCourante < fin) {
      if (this.estDansPause(dateCourante)) {
        const finPause = new Date(dateCourante);
        finPause.setHours(this.PAUSE_END_HOUR, this.PAUSE_END_MINUTE, 0, 0);
        dateCourante = new Date(Math.min(finPause.getTime(), fin.getTime()));
        continue;
      }

      const prochainEvenement = this.getProchainEvenement(dateCourante, fin);
      const diffMs = prochainEvenement.getTime() - dateCourante.getTime();
      totalMinutes += diffMs / (1000 * 60);
      dateCourante = prochainEvenement;
    }

    return totalMinutes / 60;
  }

  /**
   * Obtient le prochain événement (fin de période ou début de pause)
   */
  private getProchainEvenement(dateCourante: Date, fin: Date): Date {
    const debutPause = new Date(dateCourante);
    debutPause.setHours(this.PAUSE_START_HOUR, this.PAUSE_START_MINUTE, 0, 0);

    if (dateCourante < debutPause && fin > debutPause) {
      return debutPause;
    }

    const finPause = new Date(dateCourante);
    finPause.setHours(this.PAUSE_END_HOUR, this.PAUSE_END_MINUTE, 0, 0);

    if (this.estDansPause(dateCourante) && fin > finPause) {
      return finPause;
    }

    return fin;
  }

  /**
   * Vérifie si une date est dans la pause (12:30 - 14:30)
   */
  private estDansPause(date: Date): boolean {
    const heures = date.getHours();
    const minutes = date.getMinutes();

    const debutPauseMinutes = this.PAUSE_START_HOUR * 60 + this.PAUSE_START_MINUTE;
    const finPauseMinutes = this.PAUSE_END_HOUR * 60 + this.PAUSE_END_MINUTE;
    const minutesActuelles = heures * 60 + minutes;

    return minutesActuelles >= debutPauseMinutes && minutesActuelles < finPauseMinutes;
  }

  /**
   * Ajuste la date de début pour qu'elle soit dans les heures ouvrables
   */
  private ajusterDebut(date: Date): Date {
    const nouvelleDate = new Date(date);

    // Si weekend, aller au lundi suivant à 8h
    if (this.estWeekend(nouvelleDate)) {
      const lundi = this.getProchainLundi(nouvelleDate);
      lundi.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);
      return lundi;
    }

    // Si pendant la pause, commencer à 14:30
    if (this.estDansPause(nouvelleDate)) {
      nouvelleDate.setHours(this.PAUSE_END_HOUR, this.PAUSE_END_MINUTE, 0, 0);
      return nouvelleDate;
    }

    // Si avant 8h, commencer à 8h
    if (this.estAvantHeuresTravail(nouvelleDate)) {
      nouvelleDate.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);
      return nouvelleDate;
    }

    // Si après 18h, commencer le lendemain à 8h
    if (this.estApresHeuresTravail(nouvelleDate)) {
      const lendemain = new Date(nouvelleDate);
      lendemain.setDate(lendemain.getDate() + 1);
      if (this.estWeekend(lendemain)) {
        return this.getProchainLundi(lendemain);
      }
      lendemain.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);
      return lendemain;
    }

    return nouvelleDate;
  }

  /**
   * Ajuste la date de fin pour qu'elle soit dans les heures ouvrables
   */
  private ajusterFin(date: Date): Date {
    const nouvelleDate = new Date(date);

    // Si weekend, prendre le vendredi précédent à 18h
    if (this.estWeekend(nouvelleDate)) {
      const vendredi = new Date(nouvelleDate);
      const jour = nouvelleDate.getDay();
      vendredi.setDate(vendredi.getDate() - (jour === 0 ? 2 : 1));
      vendredi.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);
      return vendredi;
    }

    // Si pendant la pause, prendre le début de la pause
    if (this.estDansPause(nouvelleDate)) {
      nouvelleDate.setHours(this.PAUSE_START_HOUR, this.PAUSE_START_MINUTE, 0, 0);
      return nouvelleDate;
    }

    // Si avant 8h, prendre la veille à 18h
    if (this.estAvantHeuresTravail(nouvelleDate)) {
      const veille = new Date(nouvelleDate);
      veille.setDate(veille.getDate() - 1);
      if (this.estWeekend(veille)) {
        const vendredi = new Date(veille);
        const jour = veille.getDay();
        vendredi.setDate(vendredi.getDate() - (jour === 0 ? 2 : 1));
        vendredi.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);
        return vendredi;
      }
      veille.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);
      return veille;
    }

    // Si après 18h, ramener à 18h
    if (this.estApresHeuresTravail(nouvelleDate)) {
      nouvelleDate.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);
      return nouvelleDate;
    }

    return nouvelleDate;
  }

  /**
   * Formate la durée en jours, heures et minutes
   * Exemple: 32h -> "4j 0h"
   */
  formaterDuree(heures: number): string {
    if (heures <= 0) {
      return '0h';
    }

    const jours = Math.floor(heures / this.HEURES_EFFECTIVES_PAR_JOUR);
    const heuresRestantes = heures % this.HEURES_EFFECTIVES_PAR_JOUR;
    const h = Math.floor(heuresRestantes);
    const minutes = Math.round((heuresRestantes - h) * 60);

    let resultat = '';
    if (jours > 0) {
      resultat += `${jours}j `;
    }
    if (h > 0) {
      resultat += `${h}h`;
    }
    if (minutes > 0) {
      if (h > 0 && jours > 0) resultat += ' ';
      if (h === 0 && jours > 0) resultat += ' ';
      resultat += `${minutes}min`;
    }
    return resultat.trim() || '0h';
  }

  /**
   * Formate la durée en format long
   * Exemple: 32h -> "4 jours 0 heure"
   */
  formaterDureeLongue(heures: number): string {
    if (heures <= 0) {
      return '0 heure';
    }

    const jours = Math.floor(heures / this.HEURES_EFFECTIVES_PAR_JOUR);
    const heuresRestantes = heures % this.HEURES_EFFECTIVES_PAR_JOUR;
    const h = Math.floor(heuresRestantes);
    const minutes = Math.round((heuresRestantes - h) * 60);

    const parties = [];
    if (jours > 0) {
      parties.push(`${jours} jour${jours > 1 ? 's' : ''}`);
    }
    if (h > 0) {
      parties.push(`${h} heure${h > 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parties.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    return parties.join(' ') || '0 heure';
  }

  /**
   * Formate la durée en format compact (pour les petits écrans)
   * Exemple: 32h -> "4j 0h"
   */
  formaterDureeCompact(heures: number): string {
    if (heures <= 0) {
      return '0h';
    }

    const jours = Math.floor(heures / this.HEURES_EFFECTIVES_PAR_JOUR);
    const heuresRestantes = heures % this.HEURES_EFFECTIVES_PAR_JOUR;
    const h = Math.floor(heuresRestantes);
    const minutes = Math.round((heuresRestantes - h) * 60);

    let resultat = '';
    if (jours > 0) {
      resultat += `${jours}j`;
    }
    if (h > 0) {
      if (resultat) resultat += ' ';
      resultat += `${h}h`;
    }
    if (minutes > 0) {
      if (resultat) resultat += ' ';
      resultat += `${minutes}m`;
    }
    return resultat.trim() || '0h';
  }

  /**
   * Vérifie si une date est un weekend
   */
  estWeekend(date: Date): boolean {
    const jour = date.getDay();
    return jour === 0 || jour === 6;
  }

  /**
   * Vérifie si l'heure est avant 8h
   */
  private estAvantHeuresTravail(date: Date): boolean {
    const heure = date.getHours();
    const minute = date.getMinutes();
    return heure < this.WORK_START_HOUR ||
           (heure === this.WORK_START_HOUR && minute < this.WORK_START_MINUTE);
  }

  /**
   * Vérifie si l'heure est après 18h
   */
  private estApresHeuresTravail(date: Date): boolean {
    const heure = date.getHours();
    const minute = date.getMinutes();
    return heure > this.WORK_END_HOUR ||
           (heure === this.WORK_END_HOUR && minute > this.WORK_END_MINUTE);
  }

  /**
   * Obtient le prochain lundi (jour ouvrable)
   */
  private getProchainLundi(date: Date): Date {
    const nouvelleDate = new Date(date);
    const jour = nouvelleDate.getDay();
    const joursAJouter = jour === 0 ? 1 : 8 - jour;
    nouvelleDate.setDate(nouvelleDate.getDate() + joursAJouter);
    return nouvelleDate;
  }

  /**
   * Vérifie si une date est un jour ouvrable
   */
  estJourOuvrable(date: Date): boolean {
    return !this.estWeekend(date);
  }

  /**
   * Compte le nombre de jours ouvrables entre deux dates
   */
  compterJoursOuvrables(debut: string | Date, fin: string | Date): number {
    const dateDebut = typeof debut === 'string' ? this.parseDate(debut) : new Date(debut);
    const dateFin = typeof fin === 'string' ? this.parseDate(fin) : new Date(fin);
    let compteur = 0;
    const dateCourante = new Date(dateDebut);

    while (dateCourante <= dateFin) {
      if (!this.estWeekend(dateCourante)) {
        compteur++;
      }
      dateCourante.setDate(dateCourante.getDate() + 1);
    }

    return compteur;
  }

  /**
   * Obtient les heures de travail pour une date donnée
   */
  getHeuresTravailJour(date: Date): { debut: string, fin: string, pause: string } {
    const debut = new Date(date);
    debut.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);

    const fin = new Date(date);
    fin.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);

    const debutPause = new Date(date);
    debutPause.setHours(this.PAUSE_START_HOUR, this.PAUSE_START_MINUTE, 0, 0);

    const finPause = new Date(date);
    finPause.setHours(this.PAUSE_END_HOUR, this.PAUSE_END_MINUTE, 0, 0);

    return {
      debut: debut.toLocaleString('fr-FR'),
      fin: fin.toLocaleString('fr-FR'),
      pause: `${debutPause.toLocaleTimeString('fr-FR')} - ${finPause.toLocaleTimeString('fr-FR')}`
    };
  }

  /**
   * Obtient le détail des heures pour une période
   */
  getDetailDuree(debut: string | Date, fin: string | Date): {
    totalHeures: number;
    joursOuvrables: number;
    heuresParJour: number[];
    pauseTotale: number;
  } {
    const dateDebut = typeof debut === 'string' ? this.parseDate(debut) : new Date(debut);
    const dateFin = typeof fin === 'string' ? this.parseDate(fin) : new Date(fin);
    const heuresParJour: number[] = [];

    let dateCourante = new Date(dateDebut);
    let totalHeures = 0;

    while (dateCourante <= dateFin) {
      if (!this.estWeekend(dateCourante)) {
        const debutJour = new Date(dateCourante);
        debutJour.setHours(this.WORK_START_HOUR, this.WORK_START_MINUTE, 0, 0);

        const finJour = new Date(dateCourante);
        finJour.setHours(this.WORK_END_HOUR, this.WORK_END_MINUTE, 0, 0);

        let heuresJour = 0;
        const debutEffectif = dateCourante > debutJour ? dateCourante : debutJour;
        const finEffectif = dateFin < finJour ? dateFin : finJour;

        if (debutEffectif < finEffectif) {
          heuresJour = this.calculerHeuresAvecPause(debutEffectif, finEffectif);
          totalHeures += heuresJour;
          heuresParJour.push(Math.round(heuresJour * 100) / 100);
        }
      }
      dateCourante.setDate(dateCourante.getDate() + 1);
    }

    return {
      totalHeures: Math.round(totalHeures * 100) / 100,
      joursOuvrables: this.compterJoursOuvrables(debut, fin),
      heuresParJour,
      pauseTotale: 2 // 2h de pause par jour ouvrable
    };
  }

  /**
   * Calcule le nombre de jours ouvrables en format lisible
   */
  getJoursOuvrablesFormate(debut: string | Date, fin: string | Date): string {
    const jours = this.compterJoursOuvrables(debut, fin);
    return `${jours} jour${jours > 1 ? 's' : ''}`;
  }

  /**
   * Obtient le résumé de la durée pour affichage rapide
   */
  getResumeDuree(debut: string | Date, fin: string | Date): {
    formatCourt: string;
    formatLong: string;
    heures: number;
    joursOuvrables: number;
  } {
    const heures = this.calculerDureeOuvrable(debut, fin);
    const joursOuvrables = this.compterJoursOuvrables(debut, fin);

    return {
      formatCourt: this.formaterDuree(heures),
      formatLong: this.formaterDureeLongue(heures),
      heures: heures,
      joursOuvrables: joursOuvrables
    };
  }
}
