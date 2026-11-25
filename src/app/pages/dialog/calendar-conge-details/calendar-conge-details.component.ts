import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface CongeDetailsData {
  employeNom: string;
  employePrenom: string;
  employeInitiales: string;
  debut: string;
  fin: string;
  duree: number;
}

@Component({
  selector: 'app-calendar-conge-details',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './calendar-conge-details.component.html',
  styleUrl: './calendar-conge-details.component.scss'
})
export class CalendarCongeDetailsComponent {

  constructor(
    public dialogRef: MatDialogRef<CalendarCongeDetailsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CongeDetailsData
  ) {}

  close() {
    this.dialogRef.close();
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}
