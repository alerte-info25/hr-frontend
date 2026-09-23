import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { UsersService } from '../../services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loading/loading.component';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from "@angular/material/select";
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { DroitsService } from '../../services/droits.service';
import { ConfirmDeleteDialogComponent } from '../dialog/confirm-delete-dialog/confirm-delete-dialog.component';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    LoadingComponent,
    FormsModule,
    MatSelectModule,
    MatPaginatorModule,     // ✅ ajouté
    ConfirmDeleteDialogComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit, AfterViewInit {

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  roles: any[] = [];
  users: any[] = [];           // données complètes
  paginatedUsers: any[] = [];  // données affichées

  isLoading = true;
  showConfirmModal = false;
  itemToDelete: any = null;

  // Pagination
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];
  pageIndex = 0;
  totalItems = 0;

  constructor(
    private userSvr: UsersService,
    private snackBar: MatSnackBar,
    private rolesvr: DroitsService
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  ngAfterViewInit(): void {
    // Rien ici, on gère manuellement via (page) dans le template
  }

  refresh() {
    this.isLoading = true;
    this.userSvr.getListeCompte().subscribe({
      next: (data) => {
        this.users = data;
        this.totalItems = data.length;
        this.pageIndex = 0;
        this.updatePaginatedUsers();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la récupération des comptes utilisateurs ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    });

    this.rolesvr.getListeRole().subscribe({
      next: (data) => {
        this.roles = data;
        this.snackBar.open('Liste des comptes utilisateurs récupérée avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la récupération des rôles ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    });
  }

  // ✅ Met à jour la liste paginée
  updatePaginatedUsers() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = this.users.slice(start, end);
  }

  // ✅ Événement pagination
  onPageChange(event: any) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedUsers();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getRoleBadge(status: number): string {
    switch (status) {
      case 1: return "badge rounded-pill bg-success";
      case 2: return "badge rounded-pill bg-warning text-dark";
      default: return "badge rounded-pill bg-secondary";
    }
  }

  getRoleLabel(status: number) {
    switch (status) {
      case 1: return 'Actif';
      case 2: return 'Inactif';
      default: return 'Inconnu';
    }
  }

  onEtatChange(slug: string, value: number): void {
    this.isLoading = true;
    this.userSvr.changeEtatCompte(slug, { is_actif: value }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Comptes utilisateurs mis à jour ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la mise à jour du compte utilisateur ❌', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    });
  }

  onRoleChange(slug: string, id_role: number): void {
    this.isLoading = true;
    this.userSvr.changeUserRole(slug, { id_role }).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Rôle mis à jour ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['snackbar-success']
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Erreur lors de la mise à jour du rôle ❌', 'Fermer', {
          duration: 4000,
          panelClass: ['snackbar-error']
        });
        console.error(err);
      }
    });
  }

  dateString(dateInput: string | Date): string {
    if (dateInput === null) {
      return 'Jamais connecté';
    }
    const date = new Date(dateInput);
    const mois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const jour = date.getDate().toString().padStart(2, '0');
    const moisTexte = mois[date.getMonth()];
    const annee = date.getFullYear();
    return `${jour} ${moisTexte} ${annee}`;
  }

  openDeleteModal(item: any) {
    this.itemToDelete = item;
    this.showConfirmModal = true;
  }

  confirmDelete() {
    if (!this.itemToDelete) return;
    this.isLoading = true;

    this.userSvr.deleteCompte(this.itemToDelete.slug).subscribe({
      next: () => {
        this.closeModal();
        this.snackBar.open('Compte supprimé avec succès ✅', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-success']
        });
        this.refresh();
      },
      error: (err) => {
        this.closeModal();
        this.snackBar.open('Échec lors de la suppression du compte ❌', 'Fermer', {
          duration: 3000,
          panelClass: ['toast-error']
        });
        console.error(err);
      }
    });
  }

  closeModal() {
    this.showConfirmModal = false;
    this.itemToDelete = null;
  }
}
