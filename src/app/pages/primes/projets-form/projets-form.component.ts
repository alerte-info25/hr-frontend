import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrimeService } from '../../services/prime.service';
import { Employe } from '../../../models/employe.model';

interface DeveloppeurAttribution {
  employe_slug: string;
  employe?: Employe;
  pourcentage: number;
}
@Component({
  selector: 'app-projets-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './projets-form.component.html',
  styleUrl: './projets-form.component.scss'
})
export class ProjetsFormComponent {
  developpeurs: Employe[] = [];
  attributions: DeveloppeurAttribution[] = [];

  projet = {
    nom: '',
    description: '',
    montant_total: 0,
    prime_totale: 0,
    date_debut: '',
    date_fin: ''
  };

  loading = false;
  loadingDevs = true;
  error: string | null = null;

  constructor(
    private primeService: PrimeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDeveloppeurs();
  }

  loadDeveloppeurs(): void {
    this.primeService.getDeveloppeurs().subscribe({
      next: (data) => {
        this.developpeurs = data;
        this.loadingDevs = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loadingDevs = false;
      }
    });
  }

  ajouterDeveloppeur(): void {
    this.attributions.push({
      employe_slug: '',
      pourcentage: 0
    });
  }

  supprimerDeveloppeur(index: number): void {
    this.attributions.splice(index, 1);
    this.recalculerPourcentages();
  }

  onDeveloppeurChange(index: number): void {
    const attribution = this.attributions[index];
    const employe = this.developpeurs.find(d => d.slug === attribution.employe_slug);
    if (employe) {
      attribution.employe = employe;
    }
  }

  repartirEquitablement(): void {
    if (this.attributions.length === 0) return;

    const pourcentage = 100 / this.attributions.length;
    this.attributions.forEach(attr => {
      attr.pourcentage = Math.round(pourcentage * 100) / 100;
    });
  }

  recalculerPourcentages(): void {
    // Optionnel: ajuster automatiquement après suppression
    if (this.attributions.length > 0) {
      this.repartirEquitablement();
    }
  }

  getTotalPourcentage(): number {
    return this.attributions.reduce((sum, attr) => sum + (attr.pourcentage || 0), 0);
  }

  isPourcentageValid(): boolean {
    const total = this.getTotalPourcentage();
    return Math.abs(total - 100) < 0.01; // Tolérance pour les arrondis
  }

  isFormValid(): boolean {
    return (
      this.projet.nom.trim() !== '' &&
      this.projet.montant_total > 0 &&
      this.projet.prime_totale > 0 &&
      this.attributions.length > 0 &&
      this.attributions.every(attr => attr.employe_slug !== '' && attr.pourcentage > 0) &&
      this.isPourcentageValid()
    );
  }

  formatMontant(montant: number): string {
    return this.primeService.formatMontant(montant);
  }

  calculerMontantPrime(pourcentage: number): number {
    return (this.projet.prime_totale * pourcentage) / 100;
  }


  onSubmit(): void {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs correctement');
      return;
    }

    this.loading = true;
    this.error = null;

    const data = {
      ...this.projet,
      employes: this.attributions.map(attr => ({
        employe_slug: attr.employe_slug,
        pourcentage: attr.pourcentage,
        montant_prime: this.calculerMontantPrime(attr.pourcentage)
      }))
    };

    this.primeService.creerProjet(data).subscribe({
      next: (projet) => {
        this.router.navigate(['/projets', projet.id]);
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  annuler(): void {
    if (confirm('Voulez-vous vraiment annuler ? Les données non enregistrées seront perdues.')) {
      this.router.navigate(['/primes/projets']);
    }
  }
}
