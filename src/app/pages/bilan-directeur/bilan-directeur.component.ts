import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../material.module';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.developpement';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';



interface BilanDetail {
  objectif: number;
  realisation: number;
  difference: number;
  taux_realisation: number;
  statut: string;
}

interface Comparaison {
  details: { [key: string]: BilanDetail };
  taux_global: number;
  statut_global: string;
  nombre_indicateurs: number;
}

interface Bilan {
  slug: string;
  employe_id: string;
  service_id: string;
  trimestre: number;
  annee: number;
  introduction: string;
  commentaire: string;
  a_cahier_charges: boolean;
  comparaison: Comparaison | null;
  employe: { nom: string; prenom: string; slug: string };
  service: { nom: string; slug: string } | null;
  details: any[];
}

interface Statistiques {
  total_bilans: number;
  avec_cahier: number;
  sans_cahier: number;
  objectifs_atteints: number;
  objectifs_partiels: number;
  objectifs_non_atteints: number;
  taux_moyen_realisation: number;
}

interface TableauDeBord {
  periode: { annee: number; trimestre: number };
  statistiques: Statistiques;
  bilans: Bilan[];
}
type ProjetStatut = 'termine' | 'en_cours' | 'en_attente' | 'annule';
@Component({
  selector: 'app-bilan-directeur',
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './bilan-directeur.component.html',
  styleUrls: ['./bilan-directeur.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger('100ms', [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class BilanDirecteurComponent implements OnInit {

  tableauDeBord: TableauDeBord | null = null;
  selectedYear: number = new Date().getFullYear();
  selectedTrimestre: number = Math.ceil((new Date().getMonth() + 1) / 3);
  loading = true;
  error: string | null = null;

  filterService = 'all';
  filterStatut = 'all';
  searchTerm = '';

  viewMode: 'grid' | 'list' = 'grid';
  selectedBilan: Bilan | null = null;

  performanceChart: Chart | null = null;
  repartitionChart: Chart | null = null;

  annees: number[] = [];
  trimestres = [
    { value: 1, label: 'T1 (Janv-Mars)' },
    { value: 2, label: 'T2 (Avr-Juin)' },
    { value: 3, label: 'T3 (Juil-Sept)' },
    { value: 4, label: 'T4 (Oct-Déc)' }
  ];

  indicateurKeys = [
    'nombre_articles', 'nombre_reportages', 'nombre_interviews', 'nombre_videos', 'nombre_clients', 'chiffre_affaire'
  ];

  bilanIndicators: { [bilanSlug: string]: { [key: string]: any } } = {};

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) this.annees.push(currentYear - i);
  }

  trackByBilan(index: number, bilan: Bilan) {
    return bilan.slug;
  }


  ngOnInit(): void {
    this.loadTableauDeBord();
  }

  loadTableauDeBord(): void {
    this.loading = true;
    this.error = null;
    const url = `${environment.apiUrl}bilans/tableau-de-bord?annee=${this.selectedYear}&trimestre=${this.selectedTrimestre}`;
    this.http.get<{ success: boolean; data: TableauDeBord }>(url).subscribe({
      next: res => {
        this.tableauDeBord = res.data;
        this.loading = false;
        this.initCharts();
        // this.tableauDeBord?.bilans.forEach(b => this.prepareIndicators(b));
        this.tableauDeBord.bilans.forEach(b => this.prepareIndicators(b));
        setTimeout(() => this.initCharts(), 50);
      },
      error: err => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error(err);
      }
    });
  }

  initCharts(): void {
    this.createPerformanceChart();
    this.createRepartitionChart();
  }

  createPerformanceChart(): void {
    const canvas = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!canvas) return;
    this.performanceChart?.destroy();

    const bilans = this.tableauDeBord?.bilans.filter(b => b.comparaison) || [];
    const labels = bilans.map(b => `${b.employe.prenom} ${b.employe.nom}`);
    const data = bilans.map(b => b.comparaison?.taux_global ?? 0);
    const colors = data.map(val => val >= 100 ? '#22c55e' : val >= 80 ? '#fb923c' : '#ef4444');

    this.performanceChart = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Taux de réalisation (%)', data, backgroundColor: colors, borderColor: colors, borderWidth: 2, borderRadius: 8, borderSkipped: false }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `Réalisation : ${(ctx.parsed?.y ?? 0).toFixed(2)}%` } } },
        scales: { y: { beginAtZero: true, max: 150, ticks: { callback: v => `${v}%` } }, x: { grid: { display: false } } }
      }
    });
  }

  createRepartitionChart(): void {
    const canvas = document.getElementById('repartitionChart') as HTMLCanvasElement;
    if (!canvas || !this.tableauDeBord?.statistiques) return;
    this.repartitionChart?.destroy();

    const stats = this.tableauDeBord.statistiques;
    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Objectifs atteints', 'Partiellement atteints', 'Non atteints'],
        datasets: [{
          data: [stats.objectifs_atteints, stats.objectifs_partiels, stats.objectifs_non_atteints],
          backgroundColor: ['#22c55e', '#fb923c', '#ef4444'],
          borderColor: ['#22c55e', '#fb923c', '#ef4444'],
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 }, usePointStyle: true } } },
        cutout: '65%'
      }
    };
    this.repartitionChart = new Chart(canvas, config);
  }

  get filteredBilans(): Bilan[] {
    if (!this.tableauDeBord) return [];
    return this.tableauDeBord.bilans.filter(b => {
      const matchService = this.filterService === 'all' ||
        (b.service && b.service.slug === this.filterService) ||
        (this.filterService === 'external' && !b.service);

      const matchStatut = this.filterStatut === 'all'
        || (this.filterStatut === 'avec_cahier' && b.a_cahier_charges)
        || (this.filterStatut === 'sans_cahier' && !b.a_cahier_charges)
        || (b.comparaison && b.comparaison.statut_global === this.filterStatut);

      const matchSearch =
        this.searchTerm === '' ||
        `${b.employe.prenom} ${b.employe.nom}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (b.service?.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()));
      return matchService && matchStatut && matchSearch;
    });
  }

  get uniqueServices() {
    if (!this.tableauDeBord) return [];

    return Array.from(
      new Map(
        this.tableauDeBord.bilans
          .filter(b => b.service !== null)
          .map(b => [b.service!.slug, b.service!])
      ).values()
    );
  }

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onYearChange(): void { this.loadTableauDeBord(); }
  onTrimestreChange(): void { this.loadTableauDeBord(); }

  getStatutColor(statut: string): string {
    return statut === 'atteint' ? '#22c55e' : statut === 'partiellement_atteint' ? '#fb923c' : statut === 'non_atteint' ? '#ef4444' : '#6b7280';
  }
  getStatutIcon(statut: string): string {
    return statut === 'atteint' ? 'check_circle' : statut === 'partiellement_atteint' ? 'pending' : statut === 'non_atteint' ? 'cancel' : 'help';
  }
  getStatutLabel(statut: string): string {
    return statut === 'atteint' ? 'Atteint' : statut === 'partiellement_atteint' ? 'Partiel' : statut === 'non_atteint' ? 'Non atteint' : 'N/A';
  }

  getIndicateurLabel(key: string) {
    const labels: { [key: string]: string } = { nombre_articles: 'Articles', nombre_reportages: 'Reportages', nombre_interviews: 'Interviews', nombre_videos: 'Vidéos', nombre_clients: 'Clients', chiffre_affaire: 'Chiffre d\'affaires' };
    return labels[key] || key;
  }
  getIndicateurIcon(key: string) {
    const icons: { [key: string]: string } = { nombre_articles: 'article', nombre_reportages: 'videocam', nombre_interviews: 'mic', nombre_videos: 'play_circle', nombre_clients: 'groups', chiffre_affaire: 'attach_money' };
    return icons[key] || 'info';
  }

  openBilanDetails(b: Bilan): void { this.selectedBilan = b; }
  closeBilanDetails(): void { this.selectedBilan = null; }

  exportToPDF(): void {
    if (!this.tableauDeBord) return;

    const doc = new jsPDF('landscape');
    const title = `Tableau de bord - ${this.selectedYear} / T${this.selectedTrimestre}`;

    doc.setFontSize(16);
    doc.text(title, 14, 15);

    const rows = this.tableauDeBord.bilans.map(b => [
      `${b.employe.prenom} ${b.employe.nom}`,
      b.service?.nom ?? 'Prestataire externe',
      b.a_cahier_charges ? 'Oui' : 'Non',
      b.comparaison?.taux_global?.toFixed(2) + '%' || '-',
      b.comparaison?.statut_global || '-'
    ]);

    autoTable(doc, {
      startY: 25,
      head: [[
        'Employé',
        'Service',
        'Cahier des charges',
        'Taux global',
        'Statut'
      ]],
      body: rows,
      styles: {
        fontSize: 10,
        halign: 'center'
      },
      headStyles: {
        fillColor: [37, 99, 235]
      }
    });

    doc.save(`tableau-de-bord-${this.selectedYear}-T${this.selectedTrimestre}.pdf`);
  }


  exportToExcel(): void {
    if (!this.filteredBilans.length) return;

    const worksheetData = this.filteredBilans.map(b => ({
      Employe: `${b.employe.prenom} ${b.employe.nom}`,
      Service: b.service?.nom ?? 'Prestataire externe',
      'Taux global': b.comparaison?.taux_global ? b.comparaison.taux_global.toFixed(1) + '%' : 'N/A',
      Statut: b.comparaison ? this.getStatutLabel(b.comparaison.statut_global) : (b.a_cahier_charges ? 'N/A' : 'Sans cahier')
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Tableau de Bord': worksheet },
      SheetNames: ['Tableau de Bord']
    };

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `Tableau_de_Bord_${this.selectedYear}_T${this.selectedTrimestre}.xlsx`);
  }

  goToDetails(bilan: Bilan): void { this.router.navigate(['/bilan-details', bilan.slug]); }

  prepareIndicators(bilan: Bilan): void {
    if (!bilan.comparaison) return;
    this.bilanIndicators[bilan.slug] = {};
    this.indicateurKeys.forEach(key => {
      const detail = bilan.comparaison?.details[key];
      if (detail) {
        this.bilanIndicators[bilan.slug][key] = { icon: this.getIndicateurIcon(key), label: this.getIndicateurLabel(key), color: this.getStatutColor(detail.statut), detail };
      }
    });
  }

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  isHtml(val: any): boolean {
    return typeof val === 'string' && val.includes('<');
  }

  isPrimitive(val: any): boolean {
    return typeof val === 'string' || typeof val === 'number';
  }

  getProjetStatutLabel(statut: ProjetStatut): string {
    const labels: Record<ProjetStatut, string> = {
      termine: 'Terminé',
      en_cours: 'En cours',
      en_attente: 'En attente',
      annule: 'Annulé',
    };

    return labels[statut];
  }
  asString(value: unknown): string {
    return String(value);
  }

  isProjetStatut(value: unknown): value is ProjetStatut {
    return ['termine', 'en_cours', 'en_attente', 'annule'].includes(value as string);
  }




}
