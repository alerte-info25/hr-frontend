import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TypeDepenseService } from '../../../services/Caisse/type-depense.service';
import { DepenseService } from '../../../services/Caisse/depense.service';
import { TypeDepense } from '../../../models/Caisse/type-depense.model';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import {
  Depense,
  MODE_PAIEMENT_ICONS,
  MODE_PAIEMENT_LABELS,
} from '../../../models/Caisse/depense.model';
import { Title } from '@angular/platform-browser';

// ✅ Fonction utilitaire pour la pagination
function getVisiblePages(
  current: number,
  total: number,
  delta: number = 2,
): number[] {
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
}

@Component({
  selector: 'app-detail-type-depense',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    DecimalPipe,
    LoaderComponent,
  ],
  templateUrl: './detail-type-depense.component.html',
  styleUrl: './detail-type-depense.component.scss',
})
export class DetailTypeDepenseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private typeDepenseService = inject(TypeDepenseService);
  private depenseService = inject(DepenseService);
  private title = inject(Title);

  // State
  isLoading = signal(true);
  error = signal<string | null>(null);
  type = signal<TypeDepense | null>(null);
  depenses = signal<Depense[]>([]);

  // Stats
  totalMontant = computed(() =>
    this.depenses().reduce((sum, d) => sum + Number(d.montant), 0),
  );
  nbDepenses = computed(() => this.depenses().length);

  moyenneDepense = computed(() => {
    const nb = this.nbDepenses();
    return nb > 0 ? this.totalMontant() / nb : 0;
  });

  // Filtres
  filterSearch = '';
  filterMode = '';
  filterDateDebut = '';
  filterDateFin = '';

  // Pagination
  currentPage = signal(1);
  perPage = 10;
  total = signal(0);
  lastPage = signal(1);

  // Labels
  readonly modePaiementLabels = MODE_PAIEMENT_LABELS;
  readonly modePaiementIcons = MODE_PAIEMENT_ICONS;
  readonly Math = Math;

  // ✅ Getter pour les pages visibles avec ellipses
  get visiblePages(): number[] {
    return getVisiblePages(this.currentPage(), this.lastPage());
  }

  ngOnInit(): void {
    const rfk = this.route.snapshot.paramMap.get('rfk');
    if (!rfk) {
      this.router.navigate(['/caisse/types-depenses']);
      return;
    }
    this.loadData(rfk);
  }

  private loadData(rfk: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.typeDepenseService.getOne(rfk).subscribe({
      next: (typeData) => {
        this.type.set(typeData);
        this.title.setTitle(`${typeData.libelle} - Détails des dépenses`);
        this.loadDepenses(rfk);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ||
            'Impossible de charger les détails du type de dépense.',
        );
        this.isLoading.set(false);
      },
    });
  }

  private loadDepenses(rfk: string): void {
    this.isLoading.set(true);

    this.depenseService
      .getAll({
        type_depense_id: this.type()?.id,
        search: this.filterSearch || undefined,
        mode_paiement: (this.filterMode as any) || undefined,
        date_debut: this.filterDateDebut || undefined,
        date_fin: this.filterDateFin || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.depenses.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  // Filtres
  onFilterChange(): void {
    this.currentPage.set(1);
    const rfk = this.route.snapshot.paramMap.get('rfk');
    if (rfk) {
      this.loadDepenses(rfk);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    const rfk = this.route.snapshot.paramMap.get('rfk');
    if (rfk) {
      this.loadDepenses(rfk);
    }
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterSearch = '';
    this.filterMode = '';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.currentPage.set(1);
    const rfk = this.route.snapshot.paramMap.get('rfk');
    if (rfk) {
      this.loadDepenses(rfk);
    }
  }

  // Retour
  goBack(): void {
    this.router.navigate(['/caisse/types-depenses']);
  }
}
