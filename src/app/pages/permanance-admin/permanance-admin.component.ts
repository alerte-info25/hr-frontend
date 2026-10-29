import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../../material.module';
import { PermananceAdminService } from '../../services/permanance-admin.service';
import { AuthService } from '../../services/auth.service';
import { AccessDeniedComponent } from '../access-denied/access-denied.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-permanance-admin',
  imports: [CommonModule, FormsModule, MaterialModule, AccessDeniedComponent],
  templateUrl: './permanance-admin.component.html',
  styleUrl: './permanance-admin.component.scss'
})
export class PermananceAdminComponent {

  isLoading = false;

  samedi: string = '';
  dimanche: string = '';
  semaineDate: string = '';

  services: any[] = [];
  stats: any = null;

  // Filtre texte (recherche employé / service)
  searchQuery = '';

  // Services repliés / dépliés
  servicesOuverts: { [key: string]: boolean } = {};

  constructor(
    private permanenceAdminSvr: PermananceAdminService,
    private snackBar: MatSnackBar,
    private authSvr: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.semaineDate = this.getSamedi(new Date());
    this.chargerSemaine();
  }

  isEmploye(): boolean {
    return this.authSvr.isEmploye();
  }

  isDG(): boolean {
    return this.authSvr.isDG();
  }

  consulterToutesPermanences(): void {
    this.router.navigate(['/permanances']);
  }

  // ────────────────────────────────────────────
  // Navigation
  // ────────────────────────────────────────────

  private getSamedi(date: Date): string {
    const d = new Date(date);
    const jour = d.getDay();
    const diff = (jour === 6) ? 0 : (6 - jour + 7) % 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  semainePrecedente(): void {
    const d = new Date(this.semaineDate);
    d.setDate(d.getDate() - 7);
    this.semaineDate = d.toISOString().slice(0, 10);
    this.chargerSemaine();
  }

  semaineSuivante(): void {
    const d = new Date(this.semaineDate);
    d.setDate(d.getDate() + 7);
    this.semaineDate = d.toISOString().slice(0, 10);
    this.chargerSemaine();
  }

  semaineCourante(): void {
    this.semaineDate = this.getSamedi(new Date());
    this.chargerSemaine();
  }

  // ────────────────────────────────────────────
  // Chargement
  // ────────────────────────────────────────────

  chargerSemaine(): void {
    this.isLoading = true;

    this.permanenceAdminSvr.getSemaine(this.semaineDate).subscribe({
      next: (res) => {
        if (res?.success) {
          this.samedi   = res.data.samedi;
          this.dimanche = res.data.dimanche;
          this.services = res.data.services;

          // Tous les services ouverts par défaut
          this.servicesOuverts = {};
          this.services.forEach(s => {
            this.servicesOuverts[s.service.slug] = true;
          });
        }
        this.isLoading = false;
        this.chargerStats();
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

  chargerStats(): void {
    this.permanenceAdminSvr.getStats(this.semaineDate).subscribe({
      next: (res) => {
        if (res?.success) {
          this.stats = res.data.totaux;
        }
      }
    });
  }

  // ────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────

  toggleService(slug: string): void {
    this.servicesOuverts[slug] = !this.servicesOuverts[slug];
  }

  toutOuvrir(): void {
    this.services.forEach(s => this.servicesOuverts[s.service.slug] = true);
  }

  toutFermer(): void {
    this.services.forEach(s => this.servicesOuverts[s.service.slug] = false);
  }

  // ────────────────────────────────────────────
  // Filtres
  // ────────────────────────────────────────────

  get servicesFiltres(): any[] {
    if (!this.searchQuery.trim()) return this.services;

    const q = this.searchQuery.toLowerCase();

    return this.services
      .map(s => {
        const samediFiltres = s.samedi.employes.filter((e: any) =>
          this.matchEmploye(e, q)
        );
        const dimancheFiltres = s.dimanche.employes.filter((e: any) =>
          this.matchEmploye(e, q)
        );

        const serviceMatch = s.service.nom.toLowerCase().includes(q);

        if (!serviceMatch && samediFiltres.length === 0 && dimancheFiltres.length === 0) {
          return null;
        }

        return {
          ...s,
          samedi:   { ...s.samedi,   employes: samediFiltres },
          dimanche: { ...s.dimanche, employes: dimancheFiltres },
        };
      })
      .filter(s => s !== null);
  }

  private matchEmploye(e: any, q: string): boolean {
    const nom = `${e.prenom} ${e.nom}`.toLowerCase();
    const fonction = (e.fonction || '').toLowerCase();
    return nom.includes(q) || fonction.includes(q);
  }

  // ────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────

  getInitials(employe: any): string {
    const p = employe.prenom?.charAt(0) || '';
    const n = employe.nom?.charAt(0) || '';
    return (p + n).toUpperCase() || '??';
  }

  get totalSemaine(): number {
    if (!this.stats) return 0;
    return this.stats.total_permanences || 0;
  }
}
