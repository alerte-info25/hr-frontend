import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  /**
   * Point d'entrée principal pour exporter un bilan
   */
  async exportBilan(bilan: any): Promise<void> {
    try {
      await this.exportBilanToPdf(bilan);
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      throw error;
    }
  }

  /**
   * Exporte un bilan en PDF avec un design moderne
   */
  private async exportBilanToPdf(bilan: any): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Couleur du trimestre
    const trimestreColor = this.getTrimestreColor(bilan.trimestre);
    const [r, g, b] = this.hexToRgb(trimestreColor);

    // === EN-TÊTE MODERNE ===
    doc.setFillColor(r, g, b);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Motif décoratif
    doc.setFillColor(255, 255, 255, 0.1);
    for (let i = 0; i < 10; i++) {
      doc.circle(pageWidth - 20 + i * 5, 15 + i * 3, 8 + i, 'F');
    }

    // Titre principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('BILAN TRIMESTRIEL', 20, 25);

    // Badge trimestre
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.getTrimestreLabel(bilan.trimestre)} ${bilan.annee}`, 20, 35);

    // Date de génération
    doc.setFontSize(9);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 42);

    yPosition = 65;

    // === SECTION INFORMATIONS GÉNÉRALES ===
    yPosition = this.addSectionTitle(doc, 'INFORMATIONS GÉNÉRALES', yPosition, r, g, b);
    yPosition += 12;

    const infoData = [
      ['Trimestre', `${this.getTrimestreLabel(bilan.trimestre)}`],
      ['Année', bilan.annee],
      ['Date de création', new Date(bilan.created_at).toLocaleDateString('fr-FR')],
      ['Dernière mise à jour', new Date(bilan.updated_at).toLocaleDateString('fr-FR', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      })]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: infoData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 50 },
        1: { textColor: [40, 40, 40] }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // === INTRODUCTION ===
    if (bilan.introduction && this.stripHtml(bilan.introduction).trim()) {
      yPosition = this.checkAndAddPage(doc, yPosition, 40);
      yPosition = this.addSectionTitle(doc, 'INTRODUCTION', yPosition, r, g, b);
      yPosition += 10;

      yPosition = this.addRichTextContent(doc, bilan.introduction, yPosition, pageWidth);
      yPosition += 15;
    }

    // === STATISTIQUES CLÉS ===
    const stats = this.calculateStatistics(bilan);
    if (stats.total > 0) {
      yPosition = this.checkAndAddPage(doc, yPosition, 50);
      yPosition = this.addSectionTitle(doc, 'STATISTIQUES CLÉS', yPosition, r, g, b);
      yPosition += 12;

      this.addStatCard(doc, 20, yPosition, 'Total d\'éléments', stats.total.toString(), [102, 126, 234]);
      this.addStatCard(doc, 65, yPosition, 'Complétés', stats.completed.toString(), [16, 185, 129]);
      this.addStatCard(doc, 110, yPosition, 'En cours', stats.inProgress.toString(), [245, 158, 11]);
      this.addStatCard(doc, 155, yPosition, 'Sections', (bilan.details?.length || 0).toString(), [99, 102, 241]);

      yPosition += 40;
    }

    // === DÉTAILS DES ACTIVITÉS ===
    if (bilan.details && bilan.details.length > 0) {
      yPosition = this.checkAndAddPage(doc, yPosition, 40);
      yPosition = this.addSectionTitle(doc, 'DÉTAILS DES ACTIVITÉS', yPosition, r, g, b);
      yPosition += 15;

      for (const detail of bilan.details) {
        yPosition = this.addDetailSection(doc, detail, yPosition, pageWidth, pageHeight, r, g, b);
      }
    }

    // === COMMENTAIRE FINAL / CONCLUSION ===
    if (bilan.commentaire && this.stripHtml(bilan.commentaire).trim()) {
      yPosition = this.checkAndAddPage(doc, yPosition, 40);
      yPosition = this.addSectionTitle(doc, 'COMMENTAIRE FINAL', yPosition, r, g, b);
      yPosition += 10;

      yPosition = this.addRichTextContent(doc, bilan.commentaire, yPosition, pageWidth);
    }

    // === PIED DE PAGE ===
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Ligne décorative
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.5);
      doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    }

    // Téléchargement
    const fileName = `Bilan_${this.getTrimestreShortLabel(bilan.trimestre)}_${bilan.annee}.pdf`;
    doc.save(fileName);
  }

  /**
   * Ajoute une section de détail au PDF
   */
  private addDetailSection(doc: jsPDF, detail: any, yPosition: number, pageWidth: number, pageHeight: number, r: number, g: number, b: number): number {
    yPosition = this.checkAndAddPage(doc, yPosition, 30);

    // Titre de la section avec fond coloré
    doc.setFillColor(r, g, b, 0.15);
    doc.roundedRect(20, yPosition, pageWidth - 40, 12, 2, 2, 'F');

    doc.setTextColor(r, g, b);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    const sectionTitle = this.getDetailLabel(detail.cle).toUpperCase();
    doc.text(sectionTitle, 25, yPosition + 8);

    yPosition += 18;

    // Contenu selon le type
    if (this.isArticlesDetail(detail)) {
      yPosition = this.addArticlesContent(doc, detail, yPosition, pageWidth, pageHeight);
    } else if (this.isProjetsDetail(detail.valeur)) {
      yPosition = this.addProjetsContent(doc, detail, yPosition, pageWidth, pageHeight);
    } else if (typeof detail.valeur === 'number') {
      yPosition = this.addNumberContent(doc, detail, yPosition, pageHeight);
    } else if (typeof detail.valeur === 'string') {
      // Contenu texte riche (HTML)
      yPosition = this.addRichTextContent(doc, detail.valeur, yPosition, pageWidth);
    }

    return yPosition + 12;
  }

  /**
   * Ajoute du contenu riche (HTML formaté)
   */
  private addRichTextContent(doc: jsPDF, htmlContent: string, yPosition: number, pageWidth: number): number {
    // Parser le HTML et extraire le contenu structuré
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
    const body = htmlDoc.body;

    yPosition = this.processHtmlNode(doc, body, yPosition, pageWidth, 25);

    return yPosition;
  }

  /**
   * Traite récursivement les nœuds HTML
   */
  private processHtmlNode(doc: jsPDF, node: Node, yPosition: number, pageWidth: number, leftMargin: number): number {
    const maxWidth = pageWidth - leftMargin - 20;

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          yPosition = this.checkAndAddPage(doc, yPosition, 10);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          const lines = doc.splitTextToSize(text, maxWidth);
          doc.text(lines, leftMargin, yPosition);
          yPosition += lines.length * 6;
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        yPosition = this.checkAndAddPage(doc, yPosition, 15);

        switch (tagName) {
          case 'h1':
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(40, 40, 40);
            yPosition += 8;
            const h1Text = element.textContent?.trim() || '';
            const h1Lines = doc.splitTextToSize(h1Text, maxWidth);
            doc.text(h1Lines, leftMargin, yPosition);
            yPosition += h1Lines.length * 8 + 6;
            break;

          case 'h2':
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(50, 50, 50);
            yPosition += 6;
            const h2Text = element.textContent?.trim() || '';
            const h2Lines = doc.splitTextToSize(h2Text, maxWidth);
            doc.text(h2Lines, leftMargin, yPosition);
            yPosition += h2Lines.length * 7 + 5;
            break;

          case 'h3':
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(60, 60, 60);
            yPosition += 5;
            const h3Text = element.textContent?.trim() || '';
            const h3Lines = doc.splitTextToSize(h3Text, maxWidth);
            doc.text(h3Lines, leftMargin, yPosition);
            yPosition += h3Lines.length * 6 + 4;
            break;

          case 'p':
            const pText = element.textContent?.trim();
            if (pText) {
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(60, 60, 60);
              const pLines = doc.splitTextToSize(pText, maxWidth);
              doc.text(pLines, leftMargin, yPosition);
              yPosition += pLines.length * 6 + 4;
            }
            break;

          case 'strong':
          case 'b':
            const strongText = element.textContent?.trim();
            if (strongText) {
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(40, 40, 40);
              const strongLines = doc.splitTextToSize(strongText, maxWidth);
              doc.text(strongLines, leftMargin, yPosition);
              yPosition += strongLines.length * 6;
            }
            break;

          case 'ul':
          case 'ol':
            yPosition += 3;
            const listItems = element.querySelectorAll('li');
            listItems.forEach((li, index) => {
              yPosition = this.checkAndAddPage(doc, yPosition, 10);
              const liText = li.textContent?.trim();
              if (liText) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(60, 60, 60);
                const bullet = tagName === 'ol' ? `${index + 1}.` : '•';
                const fullText = `${bullet} ${liText}`;
                const liLines = doc.splitTextToSize(fullText, maxWidth - 5);
                doc.text(liLines, leftMargin + 5, yPosition);
                yPosition += liLines.length * 6 + 2;
              }
            });
            yPosition += 3;
            break;

          case 'a':
            const linkText = element.textContent?.trim();
            const href = element.getAttribute('href');
            if (linkText && href) {
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(60, 120, 200);
              doc.textWithLink(linkText, leftMargin, yPosition, { url: href });
              yPosition += 6;
            }
            break;

          case 'br':
            yPosition += 6;
            break;

          default:
            // Pour les autres éléments, traiter récursivement
            yPosition = this.processHtmlNode(doc, element, yPosition, pageWidth, leftMargin);
            break;
        }
      }
    }

    return yPosition;
  }

  /**
   * Ajoute le contenu des articles/médias
   */
  private addArticlesContent(doc: jsPDF, detail: any, yPosition: number, pageWidth: number, pageHeight: number): number {
    yPosition = this.checkAndAddPage(doc, yPosition, 20);

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(`📊 ${detail.valeur.length} élément(s) produit(s)`, 25, yPosition);
    yPosition += 10;

    if (detail.valeur.length > 0) {
      const articlesData = detail.valeur.map((item: any, index: number) => [
        (index + 1).toString(),
        item.type === 'video' ? '🎥 Vidéo' : item.type === 'article' ? '📄 Article' : item.type,
        item.lien || 'N/A'
      ]);

      yPosition = this.checkAndAddPage(doc, yPosition, 40);

      autoTable(doc, {
        startY: yPosition,
        head: [['#', 'Type', 'Lien']],
        body: articlesData,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
        headStyles: { fillColor: [102, 126, 234], textColor: 255, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: pageWidth - 87, overflow: 'linebreak' }
        },
        margin: { left: 25, right: 20 },
        didDrawPage: (data) => {
          // Gestion automatique des sauts de page
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    }

    return yPosition;
  }

  /**
   * Ajoute le contenu des projets
   */
  private addProjetsContent(doc: jsPDF, detail: any, yPosition: number, pageWidth: number, pageHeight: number): number {
    for (let i = 0; i < detail.valeur.length; i++) {
      const projet = detail.valeur[i];
      yPosition = this.checkAndAddPage(doc, yPosition, 40);

      // Carte du projet
      const cardHeight = 10 + (projet.taches?.length || 0) * 5 + 15;

      // Fond de carte
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(25, yPosition, pageWidth - 50, Math.min(cardHeight, 60), 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.roundedRect(25, yPosition, pageWidth - 50, Math.min(cardHeight, 60), 3, 3, 'S');

      yPosition += 8;

      // Nom du projet
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      const projectName = `${i + 1}. ${projet.nom}`;
      doc.text(projectName, 30, yPosition);

      // Statut
      const isCompleted = projet.statut === 'termine';
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      if (isCompleted) {
        doc.setFillColor(16, 185, 129);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(pageWidth - 60, yPosition - 5, 30, 6, 2, 2, 'F');
        doc.text('✓ Terminé', pageWidth - 55, yPosition);
      } else {
        doc.setFillColor(245, 158, 11);
        doc.setTextColor(255, 255, 255);
        doc.roundedRect(pageWidth - 60, yPosition - 5, 30, 6, 2, 2, 'F');
        doc.text('⏳ En cours', pageWidth - 55, yPosition);
      }

      yPosition += 8;

      // Tâches
      if (projet.taches && projet.taches.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'italic');
        doc.text('Tâches réalisées:', 30, yPosition);
        yPosition += 6;

        for (const tache of projet.taches) {
          yPosition = this.checkAndAddPage(doc, yPosition, 10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          const tacheText = `  ✓ ${tache}`;
          const lines = doc.splitTextToSize(tacheText, pageWidth - 75);
          doc.text(lines, 35, yPosition);
          yPosition += lines.length * 5;
        }
      }

      yPosition += 12;
    }

    return yPosition;
  }

  /**
   * Ajoute le contenu numérique
   */
  private addNumberContent(doc: jsPDF, detail: any, yPosition: number, pageHeight: number): number {
    yPosition = this.checkAndAddPage(doc, yPosition, 30);

    // Carte numérique
    doc.setFillColor(240, 245, 255);
    doc.roundedRect(25, yPosition, 80, 25, 3, 3, 'F');
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.roundedRect(25, yPosition, 80, 25, 3, 3, 'S');

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234);
    doc.text(detail.valeur.toString(), 65, yPosition + 16, { align: 'center' });

    return yPosition + 30;
  }

  /**
   * Ajoute une carte statistique
   */
  private addStatCard(doc: jsPDF, x: number, y: number, label: string, value: string, color: number[]): void {
    doc.setFillColor(color[0], color[1], color[2], 0.1);
    doc.roundedRect(x, y, 40, 25, 2, 2, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + 20, y + 12, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(label, 38);
    doc.text(lines, x + 20, y + 19, { align: 'center' });
  }

  /**
   * Ajoute un titre de section et retourne la nouvelle position Y
   */
  private addSectionTitle(doc: jsPDF, title: string, y: number, r: number, g: number, b: number): number {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(1.5);
    doc.line(20, y, 32, y);

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r, g, b);
    doc.text(title, 37, y + 1);

    return y;
  }

  /**
   * Vérifie et ajoute une nouvelle page si nécessaire
   */
  private checkAndAddPage(doc: jsPDF, currentY: number, requiredSpace: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + requiredSpace > pageHeight - 25) {
      doc.addPage();
      return 20; // Nouvelle position Y en haut de la nouvelle page
    }
    return currentY;
  }

  /**
   * Calcule les statistiques du bilan
   */
  private calculateStatistics(bilan: any): any {
    let total = 0;
    let completed = 0;
    let inProgress = 0;

    if (bilan.details) {
      bilan.details.forEach((detail: any) => {
        if (typeof detail.valeur === 'number') {
          total += detail.valeur;
        } else if (this.isProjetsDetail(detail.valeur)) {
          detail.valeur.forEach((projet: any) => {
            total++;
            if (projet.statut === 'termine') completed++;
            else inProgress++;
          });
        } else if (this.isArticlesDetail(detail)) {
          total += detail.valeur.length;
        }
      });
    }

    return { total, completed, inProgress };
  }

  // === UTILITAIRES ===

  private isArticlesDetail(detail: any): boolean {
    return detail.cle === 'articles' && Array.isArray(detail.valeur) && detail.valeur.length > 0;
  }

  private isProjetsDetail(valeur: any): boolean {
    return Array.isArray(valeur) && valeur.length > 0 && valeur[0]?.nom !== undefined;
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private getTrimestreLabel(trimestre: number): string {
    const labels = ['', 'Premier Trimestre', 'Deuxième Trimestre', 'Troisième Trimestre', 'Quatrième Trimestre'];
    return labels[trimestre] || 'Trimestre';
  }

  private getTrimestreShortLabel(trimestre: number): string {
    const labels = ['', 'T1', 'T2', 'T3', 'T4'];
    return labels[trimestre] || 'T?';
  }

  private getTrimestreColor(trimestre: number): string {
    const colors = ['', '#667eea', '#f59e0b', '#ef4444', '#10b981'];
    return colors[trimestre] || '#667eea';
  }

  private getDetailLabel(cle: string): string {
    const labels: { [key: string]: string } = {
      'articles': 'Liens des articles',
      'nombre_articles': 'Nombre d\'articles',
      'nombre_interviews': 'Nombre d\'interviews',
      'nombre_reportages': 'Nombre de reportages',
      'nombre_videos': 'Nombre de vidéos',
      'interviews': 'Interviews réalisées',
      'reportages': 'Reportages',
      'videos': 'Vidéos produites',
      'prospections': 'Activités de prospection',
      'nombre_clients': 'Nouveaux clients',
      'chiffre_affaire': 'Chiffre d\'affaires',
      'suivis_dossiers': 'Suivis de dossiers',
      'recouvrements': 'Recouvrements',
      'resultats_perspectives': 'Résultats & Perspectives',
      'projets': 'Projets développés'
    };
    return labels[cle] || cle.replace(/_/g, ' ');
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [102, 126, 234];
  }
}
