import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { MaterialModule } from '../../../../material.module';
import { FilterPipe } from "../../pipe/filter.pipe";
import { RapportService } from '../../services/rapport.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingComponent } from '../loading/loading.component';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-rapport-employe',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, LoadingComponent, ConfirmDeleteDialogComponent],
  templateUrl: './rapport-employe.component.html',
  styleUrl: './rapport-employe.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(80, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateX(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class RapportEmployeComponent {
  isLoading: boolean = true;
  user:any;
  rapports: any[] = [];
  filteredRapports: any[] = [];
  selectedRapport: any | null = null;
  showModal = false;
  showDetailModal = false;
  isEditMode = false;
  rapportForm: FormGroup;
  selectedFile: File | null = null;
  searchTerm = '';
  filterYear: number | null = null;
  filterTrimestre: number | null = null;
  years: number[] = [];
  trimestres = [1, 2, 3, 4];

  // Suppression
  showConfirmModal = false;
  itemToDelete: any = null;

  constructor(
    private fb: FormBuilder,
    private rapportSvr: RapportService,
    private authSvr: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.rapportForm = this.fb.group({
      annee: [new Date().getFullYear(), Validators.required],
      trimestre: [1, [Validators.required, Validators.min(1), Validators.max(4)]],
      commentaire: ['']
    });
  }

  get getRapportPublique(): number {
    return this.rapports.filter(r => r.statut === 1).length;
  }

  get getRapportPrive(): number {
    return this.rapports.filter(r => r.statut === 0).length;
  }


  ngOnInit(): void {
    this.user = this.authSvr.getUser();
    this.loadRapports();
    this.generateYears();
  }

  generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= currentYear - 5; i--) {
      this.years.push(i);
    }
  }

  loadRapports(): void {
    this.rapportSvr.getRapportByEmp(this.user?.employe.slug).subscribe({
      next:(data)=>{
        this.rapports = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error:(err)=>{
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Une erreur s\'est produite','Fermer',{
          duration:4000
        })
      }
    })
  }

  applyFilters(): void {
    this.filteredRapports = this.rapports.filter(rapport => {
      const matchesSearch = !this.searchTerm ||
        rapport.commentaire?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        rapport.slug.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesYear = !this.filterYear || rapport.annee === this.filterYear;
      const matchesTrimestre = !this.filterTrimestre || rapport.trimestre === this.filterTrimestre;

      return matchesSearch && matchesYear && matchesTrimestre;
    });
  }

  openModal(rapport?: any): void {
    if (rapport) {
      this.isEditMode = true;
      this.selectedRapport = rapport;
      this.rapportForm.patchValue({
        annee: rapport.annee,
        trimestre: rapport.trimestre,
        statut: rapport.statut,
        commentaire: rapport.commentaire
      });
    } else {
      this.isEditMode = false;
      this.selectedRapport = null;
      this.rapportForm.reset({
        annee: new Date().getFullYear(),
        trimestre: 1,
        statut: 1,
        commentaire: ''
      });
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedFile = null;
    this.rapportForm.reset();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      alert('Veuillez sélectionner un fichier PDF');
      event.target.value = '';
    }
  }

  submitForm(): void {
    if (this.rapportForm.invalid) return;

    const formData = new FormData();

    formData.append('annee', this.rapportForm.value.annee);
    formData.append('trimestre', this.rapportForm.value.trimestre);
    formData.append('id_employe', this.user.employe.slug);

    if (this.selectedFile) {
      formData.append('document', this.selectedFile);
    }

    // 🔁 MODE MODIFICATION
    if (this.isEditMode && this.selectedRapport) {
      this.isLoading = true;
      this.rapportSvr.updateRapport(this.selectedRapport.slug, formData).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.loadRapports();
            this.closeModal();

          },
          error: (err) => {
            this.isLoading = false;
            console.error(err);
          }
        });

    }else {
            this.isLoading = true;
      this.rapportSvr.addRapport(formData).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.loadRapports();
            this.closeModal();
          },
          error: (err) => {
            this.isLoading = false;
            console.error(err);
          }
        });
    }
  }


  viewDetails(rapport: any): void {
    this.selectedRapport = rapport;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedRapport = null;
  }

  toggleStatut(rapport: any): void {
    this.isLoading = true;
    const statu = rapport.statut === 0 ? 1 : 0;
    const data={'statut':statu}
    this.rapportSvr.changeStatut(rapport.slug, data).subscribe({
      next:(data) =>{
        this.isLoading = false
        this.loadRapports();
      },
      error:(err) =>{
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Une erreur s\'est produite','Fermer',{duration:4000})
      }
    })
  }

  downloadPDF(rapport: any): void {
    window.open(rapport.url,'_blank')
  }

  getTrimestreLabel(trimestre: number): string {
    return `T${trimestre}`;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterYear = null;
    this.filterTrimestre = null;
    this.applyFilters();
  }

  getStatutLabel(statut: number): string {
    return statut === 1 ? 'Public' : 'Privé';
  }

  getStatutIcon(statut: number): string {
    return statut === 1 ? 'public' : 'lock';
  }

  // SUPPRESSION
  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }
  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.rapportSvr.deleteRapport(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadRapports();
        this.snackBar.open('Rapport supprimer avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });

        // this.isLoading = false;
      },
      error: (err) => {
        this.closeDeleteModal();
        this.isLoading = false;
        this.snackBar.open(err.error.message || 'Echec lors de la suppression du rapport ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
      }
    });
  }
  // Ferme le modal sans supprimer
  closeDeleteModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }

}
