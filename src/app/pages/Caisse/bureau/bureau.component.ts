import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { BureauService } from '../../../services/Caisse/bureau.service';
import { BureauModel, BureauStats } from '../../../models/Caisse/bureau.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-bureau',
  imports: [RouterLink, FormsModule, CommonModule, LoaderComponent],
  templateUrl: './bureau.component.html',
  styleUrl: './bureau.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BureauComponent implements OnInit {
  private bureauService = inject(BureauService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly Math = Math;

  viewMode: 'grid' | 'table' = 'grid';

  // Liste courante (page en cours)
  bureaux = signal<BureauModel[]>([]);
  loader = signal(false);
  errorMessage = signal<string | null>(null);
  deleteRfk = signal<string | null>(null);

  // Pagination
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  perPage = 15;

  // skeleton loader
  get skeletonArray(): number[] {
    return Array(this.perPage).fill(0);
  }

  // Stats globales (tous bureaux, pas juste la page)
  stats = signal<BureauStats | null>(null);

  // Filtres
  recherche = signal('');
  villeSelectionnee = signal('');
  villes = signal<string[]>([]);

  hasOperations(bureau: BureauModel): boolean {
    return (
      (bureau.depenses_count ?? 0) > 0 || (bureau.recouvrements_count ?? 0) > 0
    );
  }

  private rechercheSubject = new Subject<string>();

  // Pages visibles avec ellipses
  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.lastPage();
    const delta = 2;

    if (total <= 1) return [1];
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    pages.push(1);

    let start = Math.max(2, current - delta);
    let end = Math.min(total - 1, current + delta);

    if (current - delta <= 2) {
      end = Math.min(total - 1, 5);
    }
    if (current + delta >= total - 1) {
      start = Math.max(2, total - 4);
    }

    if (start > 2) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-2);
    pages.push(total);

    return pages;
  });

  ngOnInit(): void {
    this.loadGlobalStats();
    this.loadBureaux();

    this.rechercheSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadBureaux();
      });
  }

  private loadGlobalStats(): void {
    this.bureauService
      .getGlobalStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.stats.set(data),
        error: () => {},
      });
  }

  private loadBureaux(): void {
    this.loader.set(true);

    const filters = {
      page: this.currentPage(),
      per_page: this.perPage,
      search: this.recherche() || undefined,
      ville: this.villeSelectionnee() || undefined,
    };

    this.bureauService
      .getAll(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.bureaux.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.loader.set(false);

          // Villes uniques extraites depuis la page courante (enrichies au fil des pages)
          const nouvelles = res.data
            .map((b) => b.ville)
            .filter((v): v is string => !!v);
          const merged = [...new Set([...this.villes(), ...nouvelles])].sort();
          this.villes.set(merged);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message ?? 'Une erreur est survenue',
          );
          this.loader.set(false);
        },
      });
  }

  onRecherche(terme: string): void {
    this.recherche.set(terme);
    this.rechercheSubject.next(terme);
  }

  onFiltreVille(ville: string): void {
    this.villeSelectionnee.set(ville);
    this.currentPage.set(1);
    this.loadBureaux();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadBureaux();
  }

  onDelete(rfk: string): void {
    const bureau = this.bureaux().find((b) => b.rfk === rfk);

    if (bureau && this.hasOperations(bureau)) {
      this.errorMessage.set(
        'Impossible de supprimer ce bureau : il possède des opérations (entrées ou sorties).',
      );
      setTimeout(() => this.errorMessage.set(null), 4000);
      return;
    }

    if (!confirm('Voulez-vous supprimer ce bureau ?')) return;

    this.deleteRfk.set(rfk);

    this.bureauService
      .delete(rfk)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleteRfk.set(null);
          this.loadBureaux();
          this.loadGlobalStats();
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

  onEdit(rfk: string): void {
    this.router.navigate(['/caisse/update-bureaux', rfk]);
  }

  transformGrid(): void {
    this.viewMode = 'grid';
  }

  transformTable(): void {
    this.viewMode = 'table';
  }
}
