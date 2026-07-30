import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Periode } from '../../../models/Caisse/periode.model';
import { RecouvrementService } from '../../../services/Caisse/recouvrement.service';
import { ExerciceComptableService } from '../../../services/Caisse/exercice-comptable.service';
import { PeriodeService } from '../../../services/Caisse/periode.service';
import { ServiceProposeService } from '../../../services/Caisse/service-propose.service';
import { CompteComptableService } from '../../../services/Caisse/compte-comptable.service';
import { ClientService } from '../../../services/Caisse/clients.service';
import { BureauService } from '../../../services/Caisse/bureau.service';
import { ExerciceModel } from '../../../models/Caisse/exercice-comptable.model';
import {
  MODE_PAIEMENT_ICONS,
  MODE_PAIEMENT_LABELS,
  ModePaiement,
  Recouvrement,
} from '../../../models/Caisse/recouvrement.model';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-recouvrement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe,
    DecimalPipe,
    LoaderComponent,
  ],
  templateUrl: './recouvrement.component.html',
  styleUrl: './recouvrement.component.scss',
})
export class RecouvrementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recouvrementService = inject(RecouvrementService);
  private exerciceService = inject(ExerciceComptableService);
  private periodeService = inject(PeriodeService);
  private serviceProposeService = inject(ServiceProposeService);
  private compteService = inject(CompteComptableService);
  private clientService = inject(ClientService);
  private bureauService = inject(BureauService);

  // Référentiels
  exercices = signal<ExerciceModel[]>([]);
  periodes = signal<Periode[]>([]);
  services = signal<any[]>([]);
  comptes = signal<any[]>([]);
  clients = signal<any[]>([]);
  bureaux = signal<any[]>([]);
  isLoadingRefs = signal(true);

  // Liste
  isLoadingList = signal(false);
  recouvrements = signal<Recouvrement[]>([]);
  currentPage = signal(1);
  perPage = 15;
  total = signal(0);
  lastPage = signal(1);

  // Stats globales (indépendantes de la pagination, recalculées uniquement
  // quand les FILTRES changent, jamais quand on change de page)
  isLoadingStats = signal(false);
  statsTotalMontant = signal(0);
  statsCount = signal(0);
  statsMoyenne = computed(() =>
    this.statsCount() > 0 ? this.statsTotalMontant() / this.statsCount() : 0,
  );

  // Total de la page courante uniquement (pour le footer du tableau)
  pageTotal = computed(() =>
    this.recouvrements().reduce((sum, r) => sum + Number(r.montant), 0),
  );

  visiblePages = computed(() => {
    const current = this.currentPage();
    const total = this.lastPage();
    const delta = 2;

    if (total <= 1) {
      return [1];
    }

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

    if (start > 2) {
      pages.push(-1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push(-2);
    }

    pages.push(total);

    return pages;
  });

  get skeletonArray(): number[] {
    return Array(this.perPage).fill(0);
  }

  // Filtres liste
  filterExerciceId = '';
  filterServiceId = '';
  filterClientId = '';
  filterMode = '';
  filterSearch = '';
  filterActif = '';

  // Formulaire
  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    exercice_id: [null, Validators.required],
    periode_id: [null, Validators.required],
    bureau_id: [null, Validators.required],
    service_propose_id: [null, Validators.required],
    compte_comptable_id: [null, Validators.required],
    client_id: [null, Validators.required],
    date_recouvrement: ['', Validators.required],
    montant: [null, [Validators.required, Validators.min(0.01)]],
    mode_paiement: [null, Validators.required],
    reference_paiement: [''],
    description: ['', [Validators.maxLength(500)]],
  });

  // Suppression
  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  // Labels
  readonly modePaiementLabels = MODE_PAIEMENT_LABELS;
  readonly modePaiementIcons = MODE_PAIEMENT_ICONS;
  readonly modesOptions = Object.entries(MODE_PAIEMENT_LABELS) as [
    ModePaiement,
    string,
  ][];
  readonly Math = Math;

  ngOnInit(): void {
    this.loadReferentiels();
  }

  private loadReferentiels(): void {
    this.isLoadingRefs.set(true);
    this.loadExercices();
  }

  private loadExercices(): void {
    this.exerciceService.getListe().subscribe({
      next: (data) => {
        this.exercices.set(data.filter((e) => !e.est_cloture));
        const actif = data.find((e) => e.est_actif && !e.est_cloture);
        if (actif) {
          this.form.patchValue({ exercice_id: actif.id });
          this.onExerciceChange(actif.id);
        }
        this.loadServices();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadServices(): void {
    this.serviceProposeService.getListe().subscribe({
      next: (data) => {
        this.services.set(data);
        this.loadComptes();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadComptes(): void {
    this.compteService.getListe().subscribe({
      next: (data) => {
        this.comptes.set(data);
        this.loadClients();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadClients(): void {
    this.clientService.getListe().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loadBureaux();
      },
      error: () => this.isLoadingRefs.set(false),
    });
  }

  private loadBureaux(): void {
    this.bureauService.getListe().subscribe({
      next: (data) => {
        this.bureaux.set(data);
        this.isLoadingRefs.set(false);
        this.loadList();
        this.loadStats();
      },
      error: () => {
        this.isLoadingRefs.set(false);
      },
    });
  }

  onExerciceChange(exerciceId: number | string): void {
    this.form.patchValue({ periode_id: null });
    this.periodes.set([]);
    if (!exerciceId) return;

    const ex = this.exercices().find((e) => e.id === Number(exerciceId));
    if (!ex) return;

    this.periodeService
      .getAll({ exercice_rfk: ex.rfk, per_page: 30 })
      .subscribe({
        next: (r) => this.periodes.set(r.data.filter((p) => !p.est_cloturee)),
      });
  }

  // Chargement liste (paginée)
  loadList(): void {
    this.isLoadingList.set(true);
    this.recouvrementService
      .getAll({
        search: this.filterSearch || undefined,
        exercice_id: this.filterExerciceId
          ? Number(this.filterExerciceId)
          : undefined,
        service_propose_id: this.filterServiceId
          ? Number(this.filterServiceId)
          : undefined,
        client_id: this.filterClientId
          ? Number(this.filterClientId)
          : undefined,
        mode_paiement: (this.filterMode as ModePaiement) || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.recouvrements.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  // Chargement stats (sur TOUTES les données filtrées, indépendant de la page)
  loadStats(): void {
    this.isLoadingStats.set(true);
    this.recouvrementService
      .getStats({
        search: this.filterSearch || undefined,
        exercice_id: this.filterExerciceId
          ? Number(this.filterExerciceId)
          : undefined,
        service_propose_id: this.filterServiceId
          ? Number(this.filterServiceId)
          : undefined,
        client_id: this.filterClientId
          ? Number(this.filterClientId)
          : undefined,
        mode_paiement: (this.filterMode as ModePaiement) || undefined,
      })
      .subscribe({
        next: (res) => {
          this.statsTotalMontant.set(res.total_montant);
          this.statsCount.set(res.nombre);
          this.isLoadingStats.set(false);
        },
        error: () => this.isLoadingStats.set(false),
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadList();
    this.loadStats();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadList();
    // Pas de loadStats() ici : les stats restent fixes lors du changement de page
  }

  // Formulaire
  resetForm(): void {
    this.editingRfk.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      exercice_id: null,
      periode_id: null,
      bureau_id: null,
      service_propose_id: null,
      compte_comptable_id: null,
      client_id: null,
      date_recouvrement: '',
      montant: null,
      mode_paiement: null,
      reference_paiement: '',
      description: '',
    });
    const actif = this.exercices().find((e) => e.est_actif);
    if (actif) {
      this.form.patchValue({ exercice_id: actif.id });
      this.onExerciceChange(actif.id);
    }
    document
      .getElementById('recouvrementForm')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  editRecouvrement(r: Recouvrement): void {
    this.editingRfk.set(r.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.onExerciceChange(r.exercice_id);
    this.form.patchValue({
      exercice_id: r.exercice_id,
      periode_id: r.periode_id,
      bureau_id: r.bureau_id,
      service_propose_id: r.service_propose_id,
      compte_comptable_id: r.compte_comptable_id,
      client_id: r.client_id,
      date_recouvrement: r.date_recouvrement.substring(0, 10),
      montant: r.montant,
      mode_paiement: r.mode_paiement,
      reference_paiement: r.reference_paiement,
      description: r.description,
    });
    document
      .getElementById('recouvrementForm')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);
    this.formSuccess.set(null);

    const payload = this.form.value;
    const request$ = this.isEditMode()
      ? this.recouvrementService.update(this.editingRfk()!, payload)
      : this.recouvrementService.create(payload);

    request$.subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Recouvrement mis à jour avec succès.'
            : 'Recouvrement enregistré avec succès.',
        );
        this.isSaving.set(false);
        this.resetForm();
        this.loadList();
        this.loadStats();
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'Une erreur est survenue.');
        this.isSaving.set(false);
      },
    });
  }

  // Suppression
  deleteRecouvrement(r: Recouvrement): void {
    const client = r.client
      ? `${r.client.nom} ${r.client.prenom ?? ''}`.trim()
      : r.rfk;
    if (
      !confirm(
        `Supprimer le recouvrement « ${r.rfk} » de ${Number(r.montant).toLocaleString('fr')} F (${client}) ?`,
      )
    )
      return;

    this.isDeleting.set(r.rfk);
    this.deleteError.set(null);

    this.recouvrementService.delete(r.rfk).subscribe({
      next: () => {
        this.isDeleting.set(null);
        this.loadList();
        this.loadStats();
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer ce recouvrement.',
        );
        this.isDeleting.set(null);
      },
    });
  }

  // Helpers formulaire
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return null;
    if (ctrl.errors['required']) return 'Ce champ est obligatoire.';
    if (ctrl.errors['min']) return 'Le montant doit être supérieur à 0.';
    if (ctrl.errors['maxlength'])
      return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }

  // Utilitaire affichage
  nomClient(r: Recouvrement): string {
    if (!r.client) return '—';
    return `${r.client.nom} ${r.client.prenom ?? ''}`.trim();
  }
}
