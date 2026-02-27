import { Component, inject, OnInit, signal } from '@angular/core';
import { CompteComptableService } from '../../../services/Caisse/compte-comptable.service';
import {
  CompteActif,
  CompteComptableModel,
} from '../../../models/Caisse/compte-comptable.model';
import { LoaderComponent } from '../../../sharedCaisse/components/loader/loader.component';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ClasseComptableService } from '../../../services/Caisse/classe-comptable.service';
import { TypeCompteComptableService } from '../../../services/Caisse/type-compte-comptable.service';
import { CategorieComptableService } from '../../../services/Caisse/categorie-comptable.service';
import { ClasseComptableModel } from '../../../models/Caisse/classe-compte-model';
import { TypeCompteComptableModel } from '../../../models/Caisse/type-compte-comptable.model';
import { CategorieComptableModel } from '../../../models/Caisse/categorie-comptable.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compte',
  imports: [LoaderComponent, FormsModule, RouterLink, CommonModule],
  templateUrl: './compte.component.html',
  styleUrl: './compte.component.scss',
})
export class CompteComponent implements OnInit {
  private compteService = inject(CompteComptableService);
  private router = inject(Router);
  private classeService = inject(ClasseComptableService);
  private typeService = inject(TypeCompteComptableService);
  private categorieService = inject(CategorieComptableService);

  comptes = signal<CompteComptableModel[]>([]);
  deleteCountRfk = signal<string | null>(null);

  // données statistque
  TotalcountAccount = signal<number | null>(null);
  TotalActifcountAccount = signal<number | null>(null);
  TotalInactifcountAccount = signal<number | null>(null);
  topActifs = signal<CompteActif[]>([]);

  // états
  succes = signal(false);
  errorMessage = signal<string | null>(null);
  loader = signal(false);

  // données stats
  solde = signal<null | number>(null);
  total_debit = signal<null | number>(null);
  total_credit = signal<null | number>(null);
  nb_operations = signal<null | number>(null);

  // selects
  classes = signal<ClasseComptableModel[]>([]);
  types = signal<TypeCompteComptableModel[]>([]);
  categories = signal<CategorieComptableModel[]>([]);

  // recherche & filtres — tout passe par ce subject
  private filtresSubject = new Subject<void>();
  recherche = signal('');
  filtreClasse = signal('');
  filtreType = signal('');
  filtreCategorie = signal('');
  filtreStatut = signal('');

  ngOnInit(): void {
    this.loadComptes();
    this.loadSelect();
    this.totalCompte();
    this.loadTopActifs();

    // Un seul pipeline pour recherche + filtres
    this.filtresSubject
      .pipe(debounceTime(250))
      .subscribe(() => this.appliquerFiltres());
  }

  private totalCompte(): void {
    this.compteService.getTotal().subscribe({
      next: (count) => {
        this.TotalcountAccount.set(count.total.total);
        this.TotalActifcountAccount.set(count.total.actifs);
        this.TotalInactifcountAccount.set(count.total.inactifs);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
      },
    });
  }

  private loadTopActifs(): void {
    this.compteService.getTopActifs().subscribe({
      next: (data) => this.topActifs.set(data),
      error: (err) => console.error('Erreur top actifs', err),
    });
  }

  getPourcentage(nbOperations: number): number {
    const max = this.topActifs()[0]?.nb_operations ?? 1;
    return Math.round((nbOperations / max) * 100);
  }

  onRecherche(terme: string) {
    this.recherche.set(terme);
    this.filtresSubject.next();
  }

  onFiltreChange() {
    this.filtresSubject.next();
  }

  private appliquerFiltres() {
    const params: Record<string, string> = {};

    if (this.recherche().trim()) params['search'] = this.recherche().trim();
    if (this.filtreClasse()) params['classe_rfk'] = this.filtreClasse();
    if (this.filtreType()) params['type_rfk'] = this.filtreType();
    if (this.filtreCategorie())
      params['categorie_rfk'] = this.filtreCategorie();
    if (this.filtreStatut()) params['statut'] = this.filtreStatut();

    // Si aucun filtre actif, recharge tout sans loader
    if (Object.keys(params).length === 0) {
      this.loadComptesWithOutLoader();
      return;
    }

    this.compteService.filtrer(params).subscribe({
      next: (data) => this.comptes.set(data),
      error: (err) =>
        this.errorMessage.set(err.error?.message ?? 'Erreur lors du filtrage'),
    });
  }

  private loadSelect() {
    this.classeService.getAll().subscribe((data) => this.classes.set(data));
    this.typeService.getAll().subscribe((data) => this.types.set(data));
    this.categorieService
      .getAll()
      .subscribe((data) => this.categories.set(data));
  }

  Solde(rfk: string): void {
    this.compteService.getSolde(rfk).subscribe({
      next: (data) => {
        this.solde.set(data.solde);
        this.total_debit.set(data.total_debit);
        this.total_credit.set(data.total_credit);
        this.nb_operations.set(data.nb_operations);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  }

  private loadComptes() {
    this.loader.set(true);
    this.compteService.getAll().subscribe({
      next: (data) => {
        this.comptes.set(data);
        this.loader.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.loader.set(false);
      },
    });
  }

  private loadComptesWithOutLoader() {
    this.compteService.getAll().subscribe({
      next: (data) => this.comptes.set(data),
      error: (err) =>
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue'),
    });
  }

  onDelete = (rfk: string) => {
    if (!confirm('Voulez-vous supprimer ce compte ?')) return;

    this.deleteCountRfk.set(rfk);
    this.loader.set(true);

    this.compteService.delete(rfk).subscribe({
      next: () => {
        this.comptes.update((liste) => liste.filter((c) => c.rfk !== rfk));
        this.deleteCountRfk.set(null);
        this.succes.set(true);
        this.loader.set(false);
        setTimeout(() => this.succes.set(false), 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'Une erreur est survenue');
        this.deleteCountRfk.set(null);
        this.loader.set(false);
        setTimeout(() => this.errorMessage.set(null), 3000);
      },
    });
  };

  toggleActif(rfk: string): void {
    this.compteService.toggleActif(rfk).subscribe({
      next: (compteMAJ) => {
        this.comptes.update((liste) =>
          liste.map((c) =>
            c.rfk === rfk ? { ...c, actif: compteMAJ.actif } : c,
          ),
        );

        this.totalCompte();
      },
      error: (err) => console.error('Erreur toggle actif', err),
    });
  }

  navigateToUpdatePage = (compteRfk: string) => {
    this.router.navigate(['/caisse/update-compte', compteRfk]);
  };
}
