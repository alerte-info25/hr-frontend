import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PrimeService } from '../../services/prime.service';
import { RapportDeveloppeur,  } from '../../../models/attribution-prime.model';
import { Employe } from '../../../models/employe.model';
@Component({
  selector: 'app-developpeur-rapport',
  imports: [CommonModule, FormsModule],
  templateUrl: './developpeur-rapport.component.html',
  styleUrl: './developpeur-rapport.component.scss'
})
export class DeveloppeurRapportComponent {
  developpeurs: Employe[] = [];
  selectedDeveloppeur: string = '';
  rapport: RapportDeveloppeur | null = null;

  loadingDevs = true;
  loadingRapport = false;
  error: string | null = null;

  constructor(
    private primeService: PrimeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDeveloppeurs();
  }

  loadDeveloppeurs(): void {
    this.loadingDevs = true;
    this.error = null;

    this.primeService.getDeveloppeurs().subscribe({
      next: (data) => {
        this.developpeurs = data;
        this.loadingDevs = false;

        // Sélectionner automatiquement le premier développeur
        if (this.developpeurs.length > 0) {
          this.selectedDeveloppeur = this.developpeurs[0].slug;
          this.loadRapport();
        }
      },
      error: (err) => {
        this.error = err.message;
        this.loadingDevs = false;
      }
    });
  }

  loadRapport(): void {
    if (!this.selectedDeveloppeur) return;

    this.loadingRapport = true;
    this.error = null;

    this.primeService.getRapportDeveloppeur(this.selectedDeveloppeur).subscribe({
      next: (data) => {
        this.rapport = data;
        this.loadingRapport = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loadingRapport = false;
      }
    });
  }

  onDeveloppeurChange(): void {
    this.loadRapport();
  }

  formatMontant(montant: number): string {
    return this.primeService.formatMontant(montant);
  }

  getStatutBadgeClass(statut: string): string {
    return this.primeService.getStatutBadgeClass(statut);
  }

  getStatutLabel(statut: string): string {
    return this.primeService.getStatutLabel(statut);
  }

  getPourcentagePaiement(attribution: any): number {
    if (attribution.montant_prime === 0) return 0;
    return (attribution.montant_paye / attribution.montant_prime) * 100;
  }

  navigateToProjet(projetId: number): void {
    this.router.navigate(['/projets', projetId]);
  }

  getPourcentageGlobal(): number {
    if (!this.rapport || this.rapport.total_primes_attribuees === 0) return 0;
    return (this.rapport.total_paye / this.rapport.total_primes_attribuees) * 100;
  }

  retour(): void {
    this.router.navigate(['/suivi-primes']);
  }
}
