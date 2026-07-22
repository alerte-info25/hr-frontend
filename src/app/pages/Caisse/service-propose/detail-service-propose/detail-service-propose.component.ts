import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';
import { ServiceProposeService } from '../../../../services/Caisse/service-propose.service';
import { RecouvrementService } from '../../../../services/Caisse/recouvrement.service';
import { ServicePropose } from '../../../../models/Caisse/service-propose.model';
import {
  MODE_PAIEMENT_ICONS,
  MODE_PAIEMENT_LABELS,
  Recouvrement,
} from '../../../../models/Caisse/recouvrement.model';

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
  selector: 'app-detail-service-propose',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    DecimalPipe,
    LoaderComponent,
  ],
  templateUrl: './detail-service-propose.component.html',
  styleUrl: './detail-service-propose.component.scss',
})
export class DetailServiceProposeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceProposeService = inject(ServiceProposeService);
  private recouvrementService = inject(RecouvrementService);
  private title = inject(Title);

  // State
  isLoading = signal(true);
  error = signal<string | null>(null);
  service = signal<ServicePropose | null>(null);
  recouvrements = signal<Recouvrement[]>([]);

  // Stats
  totalMontant = computed(() =>
    this.recouvrements().reduce((sum, r) => sum + Number(r.montant), 0),
  );
  nbRecouvrements = computed(() => this.recouvrements().length);

  moyenneRecouvrement = computed(() => {
    const nb = this.nbRecouvrements();
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
      this.router.navigate(['/caisse/services']);
      return;
    }
    this.loadData(rfk);
  }

  private loadData(rfk: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.serviceProposeService.getOne(rfk).subscribe({
      next: (serviceData) => {
        this.service.set(serviceData);
        this.title.setTitle(`${serviceData.nom} - Détails des recouvrements`);
        this.loadRecouvrements(serviceData.id);
      },
      error: (err) => {
        this.error.set(
          err?.error?.message ||
            'Impossible de charger les détails du service proposé.',
        );
        this.isLoading.set(false);
      },
    });
  }

  private loadRecouvrements(serviceId: number): void {
    this.isLoading.set(true);

    this.recouvrementService
      .getAll({
        service_propose_id: serviceId,
        search: this.filterSearch || undefined,
        mode_paiement: (this.filterMode as any) || undefined,
        date_debut: this.filterDateDebut || undefined,
        date_fin: this.filterDateFin || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.recouvrements.set(res.data);
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
    const id = this.service()?.id;
    if (id) {
      this.loadRecouvrements(id);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    const id = this.service()?.id;
    if (id) {
      this.loadRecouvrements(id);
    }
  }

  // Réinitialiser les filtres
  resetFilters(): void {
    this.filterSearch = '';
    this.filterMode = '';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.currentPage.set(1);
    const id = this.service()?.id;
    if (id) {
      this.loadRecouvrements(id);
    }
  }

  // Retour
  goBack(): void {
    this.router.navigate(['/caisse/services']);
  }
}
