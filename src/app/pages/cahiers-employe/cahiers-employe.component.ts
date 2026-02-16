import { Component, OnInit, Input } from '@angular/core';
import { CahierChargeService } from '../../services/cahier-charge.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

interface CahierDetail {
  id: number;
  slug: string;
  cle: string;
  valeur: string;
}

interface Cahier {
  id: number;
  slug: string;
  annee: number;
  trimestre: number;
  created_at: string;
  employe: {
    id: number;
    nom: string;
    prenom: string;
    slug: string;
  };
  service: {
    id: number;
    nom: string;
    slug: string;
  };
  createur: {
    id: number;
    nom: string;
    prenom: string;
    slug: string;
  };
  details: CahierDetail[];
}

@Component({
  selector: 'app-cahiers-employe',
  imports: [CommonModule, FormsModule],
  templateUrl: './cahiers-employe.component.html',
  styleUrl: './cahiers-employe.component.scss'
})
export class CahiersEmployeComponent {

  @Input() employeSlug!: string;
  user:any;
  cahiers: Cahier[] = [];
  filteredCahiers: Cahier[] = [];
  loading = true;
  error = false;
  selectedCahier: Cahier | null = null;
  searchTerm = '';
  selectedYear: string = 'all';
  selectedTrimestre: string = 'all';

  years: number[] = [];
  trimestres = [1, 2, 3, 4];

  constructor(
    private cahierService: CahierChargeService,
    private authSvr: AuthService
  ) {}

  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    this.loadCahiers();
  }

  loadCahiers(): void {
    this.loading = true;
    this.error = false;

    this.cahierService.getCahierByEmp(this.user?.employe.slug).subscribe({
      next: (data) => {
        this.cahiers = data;
        this.filteredCahiers = data;
        this.extractYears();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cahiers:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  extractYears(): void {
    const yearsSet = new Set(this.cahiers.map(c => c.annee));
    this.years = Array.from(yearsSet).sort((a, b) => b - a);
  }

  filterCahiers(): void {
    this.filteredCahiers = this.cahiers.filter(cahier => {
      const matchYear = this.selectedYear === 'all' || cahier.annee.toString() === this.selectedYear;
      const matchTrimestre = this.selectedTrimestre === 'all' || cahier.trimestre.toString() === this.selectedTrimestre;
      const matchSearch = this.searchTerm === '' ||
        cahier.service.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        cahier.createur.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        cahier.createur.prenom.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchYear && matchTrimestre && matchSearch;
    });
  }

  onYearChange(year: string): void {
    this.selectedYear = year;
    this.filterCahiers();
  }

  onTrimestreChange(trimestre: string): void {
    this.selectedTrimestre = trimestre;
    this.filterCahiers();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.filterCahiers();
  }

  selectCahier(cahier: Cahier): void {
    this.selectedCahier = this.selectedCahier?.id === cahier.id ? null : cahier;
  }

  getTrimestreLabel(trimestre: number): string {
    return `T${trimestre}`;
  }

  getTrimestreColor(trimestre: number): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    return colors[trimestre - 1] || '#6b7280';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getDetailsByCategory(details: CahierDetail[]): Map<string, CahierDetail[]> {
    const categorized = new Map<string, CahierDetail[]>();

    details.forEach(detail => {
      const category = detail.cle.split('_')[0] || 'Autre';
      if (!categorized.has(category)) {
        categorized.set(category, []);
      }
      categorized.get(category)!.push(detail);
    });

    return categorized;
  }

  getCategoryTitle(category: string): string {
    const titles: { [key: string]: string } = {
      'objectif': 'Objectifs',
      'tache': 'Tâches',
      'indicateur': 'Indicateurs',
      'ressource': 'Ressources',
      'delai': 'Délais',
      'competence': 'Compétences'
    };
    return titles[category.toLowerCase()] || category;
  }
}
