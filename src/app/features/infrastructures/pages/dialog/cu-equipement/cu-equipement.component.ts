import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  HostListener,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type EtatEquipement =
  | 'neuf'
  | 'bon_etat'
  | 'usage'
  | 'en_panne'
  | 'en_maintenance'
  | 'reforme';

export interface Equipement {
  slug?: string;
  code_interne?: string;
  designation: string;
  categorie_slug: string;
  zone_slug: string;
  bureau_slug: string;
  marque: string;
  modele: string;
  numero_serie: string;
  configuration: string;
  etat: EtatEquipement;
  date_garantie_fin: string;
  notes: string;
  created_at?: string;
}

export interface EtatOption {
  value: EtatEquipement;
  label: string;
  icon: string;
  cssClass: string;
}

export interface Categorie {
  slug: string;
  label: string;
}

export interface Zone {
  slug: string;
  label: string;
}
@Component({
  selector: 'app-cu-equipement',
  imports: [CommonModule, FormsModule],
  templateUrl: './cu-equipement.component.html',
  styleUrl: './cu-equipement.component.scss'
})
export class CuEquipementComponent {

  @Input() equipement: Equipement | null = null;
  /** Contrôle l'ouverture du dialog */
  @Input() isOpen = false;
  /** Émet quand l'utilisateur valide le formulaire */
  @Output() save = new EventEmitter<Equipement>();
  /** Émet quand le dialog se ferme */
  @Output() closed = new EventEmitter<void>();

  // ── Onglet actif ──────────────────────────────────────────────
  activeTab: 'general' | 'technique' | 'notes' = 'general';

  // ── Animation ─────────────────────────────────────────────────
  isVisible = false;
  isAnimatingIn = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  // ── État du formulaire ─────────────────────────────────────────
  isSaving = false;
  saveSuccess = false;

  // ── Données formulaire ─────────────────────────────────────────
  form: Equipement = this.emptyForm();

  // ── Données statiques ─────────────────────────────────────────
  readonly etats: EtatOption[] = [
    { value: 'neuf',           label: 'Neuf',        icon: 'fiber_new',       cssClass: 'etat--neuf'    },
    { value: 'bon_etat',       label: 'Bon état',    icon: 'check_circle',    cssClass: 'etat--bon'     },
    { value: 'usage',          label: 'Usagé',       icon: 'history',         cssClass: 'etat--usage'   },
    { value: 'en_panne',       label: 'En panne',    icon: 'report_problem',  cssClass: 'etat--panne'   },
    { value: 'en_maintenance', label: 'Maintenance', icon: 'handyman',        cssClass: 'etat--maint'   },
    { value: 'reforme',        label: 'Hors service',     icon: 'archive',         cssClass: 'etat--reforme' },
  ];

  readonly categories: Categorie[] = [
    { slug: 'informatique', label: 'Informatique' },
    { slug: 'mobilier',     label: 'Mobilier'     },
    { slug: 'audiovisuel',  label: 'Audiovisuel'  },
    { slug: 'reseau',       label: 'Réseau'       },
    { slug: 'vehicule',     label: 'Véhicule'     },
    { slug: 'autre',        label: 'Autre'        },
  ];

  readonly zones: Zone[] = [
    { slug: 'zone-a',    label: 'Zone A'    },
    { slug: 'zone-b',    label: 'Zone B'    },
    { slug: 'zone-c',    label: 'Zone C'    },
    { slug: 'entrepot',  label: 'Entrepôt'  },
    { slug: 'exterieur', label: 'Extérieur' },
  ];

  // ── Computed ───────────────────────────────────────────────────
  get isEditMode(): boolean {
    return !!this.equipement?.slug;
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Modifier l\'équipement' : 'Nouvel équipement';
  }

  get dialogSubtitle(): string {
    return this.isEditMode
      ? 'Modifiez les champs souhaités'
      : 'Remplissez les informations ci-dessous';
  }

  get dialogIcon(): string {
    return this.isEditMode ? 'edit' : 'devices';
  }

  get saveLabel(): string {
    if (this.saveSuccess) return 'Enregistré !';
    if (this.isSaving)    return 'Enregistrement…';
    return this.isEditMode ? 'Mettre à jour' : 'Enregistrer';
  }

  get saveIcon(): string {
    if (this.saveSuccess) return 'check_circle';
    if (this.isSaving)    return 'hourglass_empty';
    return 'save';
  }

  get garantieExpired(): boolean | null {
    if (!this.form.date_garantie_fin) return null;
    return new Date(this.form.date_garantie_fin) < new Date();
  }

  get footerDate(): string {
    if (!this.isEditMode) return 'Création le —';
    const d = this.equipement?.created_at;
    return d ? `Créé le ${d}` : 'Création le —';
  }

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.openDialog();
      } else {
        this.closeDialog();
      }
    }
    if (changes['equipement'] && this.equipement) {
      this.fillForm(this.equipement);
    }
  }

  // ── Keyboard ──────────────────────────────────────────────────
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isVisible) this.requestClose();
  }

  // ── Méthodes ──────────────────────────────────────────────────
  private openDialog(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.activeTab = 'general';
    this.isSaving = false;
    this.saveSuccess = false;
    this.form = this.equipement ? this.fillForm(this.equipement) : this.emptyForm();
    this.isVisible = true;
    requestAnimationFrame(() => { this.isAnimatingIn = true; });
  }

  private closeDialog(): void {
    this.isAnimatingIn = false;
    this.closeTimer = setTimeout(() => { this.isVisible = false; }, 300);
  }

  requestClose(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.requestClose();
    }
  }

  switchTab(tab: 'general' | 'technique' | 'notes'): void {
    this.activeTab = tab;
  }

  onSave(): void {
    if (this.isSaving || this.saveSuccess) return;
    this.isSaving = true;

    // Simule un appel API — à remplacer par votre service
    setTimeout(() => {
      this.isSaving = false;
      this.saveSuccess = true;
      this.save.emit({ ...this.form });
      setTimeout(() => { this.requestClose(); }, 900);
    }, 800);
  }

  // ── Helpers ───────────────────────────────────────────────────
  private emptyForm(): Equipement {
    return {
      designation:       '',
      categorie_slug:    '',
      zone_slug:         '',
      bureau_slug:       '',
      marque:            '',
      modele:            '',
      numero_serie:      '',
      configuration:     '',
      etat:              'bon_etat',
      date_garantie_fin: '',
      notes:             '',
    };
  }

  private fillForm(eq: Equipement): Equipement {
    this.form = {
      slug:              eq.slug,
      code_interne:      eq.code_interne,
      designation:       eq.designation       ?? '',
      categorie_slug:    eq.categorie_slug    ?? '',
      zone_slug:         eq.zone_slug         ?? '',
      bureau_slug:       eq.bureau_slug       ?? '',
      marque:            eq.marque            ?? '',
      modele:            eq.modele            ?? '',
      numero_serie:      eq.numero_serie      ?? '',
      configuration:     eq.configuration     ?? '',
      etat:              eq.etat              ?? 'bon_etat',
      date_garantie_fin: eq.date_garantie_fin ?? '',
      notes:             eq.notes             ?? '',
    };
    return this.form;
  }
}
