import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PermananceService } from '../../services/permanance.service';
import { MaterialModule } from "../../../../material.module";
import { Router } from '@angular/router';
interface SelectionPermanence {
  samedi: boolean;
  dimanche: boolean;
}

type JourPermanence = 'samedi' | 'dimanche';

@Component({
  selector: 'app-permanance-responsable',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './permanance-responsable.component.html',
  styleUrl: './permanance-responsable.component.scss'
})
export class PermananceResponsableComponent implements OnInit {

  isLoading = false;
  isSaving = false;

  service: any = null;
  employes: any[] = [];

  samedi = '';
  dimanche = '';

  selection: { [key: string]: SelectionPermanence } = {};

  semaineDate = '';

  constructor(
    private permananceSvr: PermananceService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.semaineDate = this.getSamedi(new Date());
    this.chargerSemaine();
  }

  /* ---------- Utilitaires de dates (sans décalage de fuseau) ---------- */

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${j}`;
  }

  private parseIso(iso: string): Date {
    return new Date(`${iso}T00:00:00`);
  }

  private getSamedi(date: Date): string {
    const d = new Date(date);
    const jour = d.getDay(); // 0 = dim, 6 = sam
    const diff = jour === 6 ? 0 : (6 - jour + 7) % 7;
    d.setDate(d.getDate() + diff);
    return this.toIso(d);
  }

  formatDate(iso: string, court = false): string {
    if (!iso) return '';
    return this.parseIso(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: court ? 'short' : 'long',
      year: court ? undefined : 'numeric'
    });
  }

  get estSemaineCourante(): boolean {
    return this.semaineDate === this.getSamedi(new Date());
  }

  /* ---------- Chargement ---------- */

  chargerSemaine(): void {
    this.isLoading = true;
    this.permananceSvr.getSemaine(this.semaineDate).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res?.success) {
          this.service  = res.data.service;
          this.employes = res.data.employes;
          this.samedi   = res.data.samedi;
          this.dimanche = res.data.dimanche;

          this.selection = {};
          this.employes.forEach(e => {
            this.selection[e.slug] = { samedi: false, dimanche: false };
          });

          res.data.permanences.forEach((p: any) => {
            if (this.selection[p.employe]) {
              const jour = p.type as JourPermanence;
              this.selection[p.employe][jour] = true;
            }
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(
          err.error?.message || 'Erreur lors du chargement',
          'Fermer',
          { duration: 3000 }
        );
      }
    });
  }

  /* ---------- Règles métier ---------- */

  /** Journalistes : cocher samedi décoche dimanche (et inversement). */
  onToggle(employeSlug: string, type: JourPermanence): void {
    if (!this.service?.est_journaliste) return;

    const sel = this.selection[employeSlug];
    if (type === 'samedi' && sel.samedi) sel.dimanche = false;
    if (type === 'dimanche' && sel.dimanche) sel.samedi = false;
  }

  isDisabled(employeSlug: string, type: JourPermanence): boolean {
    if (!this.service?.est_journaliste) return false;
    const sel = this.selection[employeSlug];
    if (!sel) return false;
    return type === 'samedi' ? sel.dimanche : sel.samedi;
  }

  /* ---------- Enregistrement ---------- */

  enregistrer(): void {
    const affectations: any[] = [];

    Object.keys(this.selection).forEach(slug => {
      const sel = this.selection[slug];
      if (sel.samedi) {
        affectations.push({ employe: slug, date: this.samedi, type: 'samedi' });
      }
      if (sel.dimanche) {
        affectations.push({ employe: slug, date: this.dimanche, type: 'dimanche' });
      }
    });

    this.isSaving = true;
    this.permananceSvr.savePlanning({
      samedi: this.samedi,
      dimanche: this.dimanche,
      affectations,
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.snackBar.open(res.message || 'Planning enregistré ✅', 'Fermer', { duration: 3000 });
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

  consulterToutesPermanences(): void {
    this.router.navigate(['/permanances-admin']);
  }

  /* ---------- Navigation ---------- */

  private decalerSemaine(jours: number): void {
    const d = this.parseIso(this.semaineDate);
    d.setDate(d.getDate() + jours);
    this.semaineDate = this.toIso(d);
    this.chargerSemaine();
  }

  semainePrecedente(): void { this.decalerSemaine(-7); }
  semaineSuivante(): void { this.decalerSemaine(7); }

  semaineCourante(): void {
    this.semaineDate = this.getSamedi(new Date());
    this.chargerSemaine();
  }

  /* ---------- Affichage ---------- */

  initiales(emp: any): string {
    return `${emp.prenom?.charAt(0) ?? ''}${emp.nom?.charAt(0) ?? ''}`.toUpperCase();
  }

  trackBySlug(_: number, emp: any): string {
    return emp.slug;
  }

  get totalSelectionnes(): number {
    return Object.values(this.selection).filter(s => s.samedi || s.dimanche).length;
  }

  get totalSamedi(): number {
    return Object.values(this.selection).filter(s => s.samedi).length;
  }

  get totalDimanche(): number {
    return Object.values(this.selection).filter(s => s.dimanche).length;
  }
}