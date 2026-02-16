import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MaterialModule } from '../../../../material.module';
import { MatDialog } from '@angular/material/dialog';
import { EmployesService } from '../../services/employes.service';
import { RapportService } from '../../services/rapport.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-rapports',
  imports: [CommonModule,FormsModule,MaterialModule],
  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class RapportsComponent implements OnInit {
rapports: any[] = [];
  rapportsFiltres: any[] = [];
  employes: any[] = [];

  // Filtres
  employeSelectionne: number | null = null;
  trimestreSelectionne: number | null = null;
  anneeSelectionnee: number | null = null;

  // Années disponibles
  years: number[] = [];
  trimestres = [
    { value: 1, label: 'T1 (Jan-Mar)' },
    { value: 2, label: 'T2 (Avr-Juin)' },
    { value: 3, label: 'T3 (Juil-Sept)' },
    { value: 4, label: 'T4 (Oct-Déc)' }
  ];

  // Détails
  rapportSelectionne: any | null = null;
  nouveauCommentaire: string = '';
  isLoading = false;

  constructor(
    private dialog: MatDialog,
    private empSvr: EmployesService,
    private rapportSvr: RapportService,
    private snacBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.generateYears()
    this.chargerDonnees()
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  chargerDonnees(): void {
    this.isLoading = true;

    // Charger les employés
    this.empSvr.getList().subscribe({
      next: (employes) => {
        this.employes = employes;
      },
      error: (err) => {
        this.snacBar.open(
          err?.error?.message || 'Erreur lors du chargement des employés',
          'Fermer',
          { duration: 4000 }
        );
      }
    });

    // Charger les rapports
    this.rapportSvr.getList().subscribe({
      next: (rapports) => {
        this.rapports = rapports;
        this.rapportsFiltres = [...rapports];

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snacBar.open(
          err?.error?.message || 'Erreur lors du chargement des rapports',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }


  appliquerFiltres(): void {
    this.rapportsFiltres = this.rapports.filter(rapport => {
      return (
        (!this.employeSelectionne || rapport.id_employe === this.employeSelectionne) &&
        (!this.trimestreSelectionne || rapport.trimestre === this.trimestreSelectionne) &&
        (!this.anneeSelectionnee || Number(rapport.annee) === this.anneeSelectionnee)
      );
    });
  }


  reinitialiserFiltres(): void {
    this.employeSelectionne = null;
    this.trimestreSelectionne = null;
    this.anneeSelectionnee = null;
    this.rapportsFiltres = [...this.rapports];
  }


  ouvrirDetails(rapport: any) {
    this.rapportSelectionne = rapport;
    this.nouveauCommentaire = rapport.commentaire || '';
  }

  fermerDetails() {
    this.rapportSelectionne = null;
    this.nouveauCommentaire = '';
  }

  telechargerRapport(rapport: any) {
    // Implémenter le téléchargement
    window.open(rapport.url, '_blank');
  }

  sauvegarderCommentaire() {
    this.isLoading = true;
    if (this.rapportSelectionne) {
      // Appel API pour sauvegarder le commentaire
      const data ={'commentaire':this.nouveauCommentaire}
      this.rapportSvr.CommenterRapport(this.rapportSelectionne.slug,data).subscribe({
        next:()=>{
          this.isLoading = false
          this.chargerDonnees();
        },
        error:(err)=>{
          this.isLoading = false;
          this.snacBar.open(err.error.message || 'Une erreur s\'est produite','Fermer',{duration:4000})
        }
      })
      // Mettre à jour dans la liste
      // const index = this.rapports.findIndex(r => r.id === this.rapportSelectionne!.id);
      // if (index !== -1) {
      //   this.rapports[index].commentaire = this.nouveauCommentaire;
      // }

      this.fermerDetails();
    }
  }

}
