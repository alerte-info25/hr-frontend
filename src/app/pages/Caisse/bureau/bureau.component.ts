import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BureauService } from '../../../services/Caisse/bureau.service';
import { BureauModel, BureauStats } from '../../../models/Caisse/bureau.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-bureau',
  imports: [RouterLink, FormsModule, LoaderComponent],
  templateUrl: './bureau.component.html',
  styleUrl: './bureau.component.scss',
})
export class BureauComponent implements OnInit {
  private bureauService = inject(BureauService);
  private router = inject(Router);

  viewMode: 'grid' | 'table' = 'grid';
  bureaux = signal<BureauModel[]>([]);
  loader = signal(false);
  errorMessage = signal<string | null>(null);
  deleteRfk = signal<string | null>(null);
  stats = signal<BureauStats | null>(null);
  villes = signal<string[]>([]);

  ngOnInit(): void {
    this.loadBureaux();
    this.animerStats();
    this.loadStats();
    this.loadSelect();

    this.rechercheSubject
      .pipe(debounceTime(300))
      .subscribe((terme) => this.recherche.set(terme));
  }

  // recherche
  recherche = signal('');
  villeSelectionnee = signal('');
  private rechercheSubject = new Subject<string>();

  // Calculé automatiquement depuis bureaux + filtres
  bureauxFiltres = computed(() => {
    const terme = this.recherche().toLowerCase();
    const ville = this.villeSelectionnee();

    return this.bureaux().filter((b) => {
      const matchRecherche =
        !terme ||
        b.libelle.toLowerCase().includes(terme) ||
        b.code.toLowerCase().includes(terme) ||
        b.ville?.toLowerCase().includes(terme) ||
        b.rue?.toLowerCase().includes(terme);

      const matchVille = !ville || b.ville === ville;

      return matchRecherche && matchVille;
    });
  });

  onRecherche(terme: string): void {
    this.rechercheSubject.next(terme);
  }

  onFiltreVille(ville: string): void {
    this.villeSelectionnee.set(ville);
  }

  private loadBureaux(): void {
    this.loader.set(true);

    this.bureauService.getAll().subscribe({
      next: (data) => {
        this.bureaux.set(data);
        this.loader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.loader.set(false);
      },
    });
  }

  private loadStats(): void {
    this.bureauService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Erreur stats', err),
    });
  }

  onDelete(rfk: string): void {
    if (!confirm('Voulez-vous supprimer ce bureau ?')) return;

    this.deleteRfk.set(rfk);

    this.bureauService.delete(rfk).subscribe({
      next: () => {
        this.bureaux.update((liste) => liste.filter((b) => b.rfk !== rfk));
        this.deleteRfk.set(null);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message ?? 'Erreur lors de la suppression',
        );
        this.deleteRfk.set(null);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  onEdit(rfk: string) {
    this.router.navigate(['/caisse/update-bureaux', rfk]);
  }

  transformGrid(): void {
    this.viewMode = 'grid';
  }

  transformTable(): void {
    this.viewMode = 'table';
  }

  private animerStats(): void {
    setTimeout(() => {
      document.querySelectorAll('.stats-value').forEach((element) => {
        if (element instanceof HTMLElement) {
          const num = parseInt(
            (element.textContent || '').replace(/[^0-9]/g, ''),
            10,
          );
          if (!isNaN(num) && num > 0) {
            element.textContent = '0';
            this.animateValue(element, 0, num, 2000);
          }
        }
      });
    }, 0);
  }

  private animateValue(
    element: HTMLElement,
    start: number,
    end: number,
    duration: number,
  ): void {
    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      element.innerText = Math.floor(
        progress * (end - start) + start,
      ).toString();
      if (progress < 1) window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
  }

  private loadSelect() {
    this.bureauService.getAll().subscribe({
      next: (data) => {
        const villesUniques = [
          ...new Set(data.map((b) => b.ville).filter((v): v is string => !!v)),
        ].sort();

        this.villes.set(villesUniques);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
      },
    });
  }
}
