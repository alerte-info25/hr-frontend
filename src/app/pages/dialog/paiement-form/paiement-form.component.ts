import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeService } from '../../services/prime.service';
import { AttributionPrime } from '../../../models/attribution-prime.model';
@Component({
  selector: 'app-paiement-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './paiement-form.component.html',
  styleUrl: './paiement-form.component.scss'
})
export class PaiementFormComponent {
  @Input() attributionPrimeId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  attribution: AttributionPrime | null = null;
  loading = false;
  loadingData = true;
  error: string | null = null;

  paiement = {
    montant: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'virement',
    reference: '',
    commentaire: ''
  };

  modesPaiement = [
    { value: 'virement', label: 'Virement Bancaire', icon: 'account_balance' },
    { value: 'especes', label: 'Espèces', icon: 'payments' },
    { value: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
    { value: 'cheque', label: 'Chèque', icon: 'receipt' }
  ];

  constructor(private primeService: PrimeService) {}

  ngOnInit(): void {
    // Charger les détails de l'attribution
    // En production, vous devriez avoir un endpoint pour récupérer une attribution spécifique
    this.loadingData = false;
  }

  formatMontant(montant: number): string {
    return this.primeService.formatMontant(montant);
  }

  getModeIcon(mode: string): string {
    return this.modesPaiement.find(m => m.value === mode)?.icon || 'payment';
  }

  getModeLabel(mode: string): string {
    return this.modesPaiement.find(m => m.value === mode)?.label || mode;
  }

  isFormValid(): boolean {
    return (
      this.paiement.montant > 0 &&
      this.paiement.date_paiement !== '' &&
      this.paiement.mode_paiement !== ''
    );
  }

  payerSolde(): void {
    if (this.attribution) {
      this.paiement.montant = this.attribution.montant_restant;
    }
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.loading = true;
    this.error = null;

    const data = {
      attribution_prime_id: this.attributionPrimeId,
      ...this.paiement
    };

    this.primeService.enregistrerPaiement(data).subscribe({
      next: () => {
        this.success.emit();
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }

  onClose(): void {
    if (this.loading) return;
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
