import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Client } from '../../../models/Caisse/client.model';
import { ClientService } from '../../../services/Caisse/clients.service';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    LoaderComponent,
  ], 
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);

  isLoadingList = signal(false);
  clients = signal<Client[]>([]);
  searchQuery = '';

  currentPage = signal(1);
  perPage = 10;
  total = signal(0);
  lastPage = signal(1);

  totalClients = computed(() => this.total());
  totalRecouvrements = computed(() =>
    this.clients().reduce((sum, c) => sum + (c.recouvrements_count ?? 0), 0),
  );
  clientsActifs = computed(
    () => this.clients().filter((c) => (c.recouvrements_count ?? 0) > 0).length,
  );
  totalRecouvrementsMontant = computed(() =>
    // ← ajout
    this.clients().reduce(
      (sum, c) => sum + (c.recouvrements_sum_montant ?? 0),
      0,
    ),
  );

  editingRfk = signal<string | null>(null);
  isEditMode = computed(() => this.editingRfk() !== null);
  isSaving = signal(false);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    nom: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    prenom: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    telephone: ['', [Validators.maxLength(20)]],
    adresse: ['', [Validators.maxLength(255)]],
  });

  isDeleting = signal<string | null>(null);
  deleteError = signal<string | null>(null);

  readonly Math = Math;

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.isLoadingList.set(true);
    this.clientService
      .getAll({
        search: this.searchQuery || undefined,
        page: this.currentPage(),
        per_page: this.perPage,
      })
      .subscribe({
        next: (res) => {
          this.clients.set(res.data);
          this.total.set(res.total);
          this.lastPage.set(res.last_page);
          this.isLoadingList.set(false);
        },
        error: () => this.isLoadingList.set(false),
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadList();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.loadList();
  }

  pages(): number[] {
    return Array.from({ length: this.lastPage() }, (_, i) => i + 1);
  }

  resetForm(): void {
    this.editingRfk.set(null);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.reset({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
    });
  }

  editClient(client: Client): void {
    this.editingRfk.set(client.rfk);
    this.formError.set(null);
    this.formSuccess.set(null);
    this.form.patchValue({
      nom: client.nom,
      prenom: client.prenom,
      email: client.email,
      telephone: client.telephone,
      adresse: client.adresse,
    });
    document
      .getElementById('clientForm')
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
      ? this.clientService.update(this.editingRfk()!, payload)
      : this.clientService.create(payload);

    request$.subscribe({
      next: () => {
        this.formSuccess.set(
          this.isEditMode()
            ? 'Client mis à jour avec succès.'
            : 'Client créé avec succès.',
        );
        this.isSaving.set(false);
        this.resetForm();
        this.loadList();
      },
      error: (err) => {
        this.formError.set(err?.error?.message ?? 'Une erreur est survenue.');
        this.isSaving.set(false);
      },
    });
  }

  deleteClient(client: Client): void {
    const nom = `${client.nom} ${client.prenom}`.trim();
    if (
      !confirm(
        `Supprimer le client « ${nom} » ? Cette action est irréversible.`,
      )
    )
      return;
    this.isDeleting.set(client.rfk);
    this.deleteError.set(null);
    this.clientService.delete(client.rfk).subscribe({
      next: () => {
        this.isDeleting.set(null);
        this.loadList();
      },
      error: (err) => {
        this.deleteError.set(
          err?.error?.message ?? 'Impossible de supprimer ce client.',
        );
        this.isDeleting.set(null);
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  getError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (!ctrl?.errors || !ctrl.touched) return null;
    if (ctrl.errors['required']) return 'Ce champ est obligatoire.';
    if (ctrl.errors['email']) return 'Adresse email invalide.';
    if (ctrl.errors['minlength'])
      return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    if (ctrl.errors['maxlength'])
      return `Maximum ${ctrl.errors['maxlength'].requiredLength} caractères.`;
    return 'Valeur invalide.';
  }

  nomComplet(client: Client): string {
    return `${client.nom} ${client.prenom ?? ''}`.trim();
  }
}
