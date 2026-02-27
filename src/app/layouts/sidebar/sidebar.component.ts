import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SidebarService } from '../../services/sidebar.service'; // Ajustez le chemin
import { MaterialModule } from '../../../../material.module';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FONCTIONS } from '../../models/Caisse/verification-fonction.model';

@Component({
  selector: 'app-sidebar',
  imports: [MaterialModule, CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {
  userRights: string[] = [];
  userData: any = JSON.parse(localStorage.getItem('user_token') || '{}');
  private destroy$ = new Subject<void>();
  isSidebarOpen = true;
  openSection: string | null = null;
  constructor(
    private sidebarService: SidebarService,
    private authSvr: AuthService,
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'état de la sidebar
    this.authSvr.user$.subscribe((user) => {
      this.userData = user;
    });
    this.sidebarService.sidebarState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen) => {
        this.isSidebarOpen = isOpen;
      });
    const user = localStorage.getItem('user_token');
    if (user) {
      this.userData = JSON.parse(user);
      const droitsString = this.userData?.role?.droits?.libelle || '';
      this.userRights = droitsString.split('-'); // transforme en tableau
    }
  }

  hasRight(moduleName: string): boolean {
    return this.userRights.includes(moduleName);
  }

  private readonly CAISSE_FONCTIONS = [
    FONCTIONS.COMPTABLE,
    FONCTIONS.COMMERCIALE,
    FONCTIONS.DIRECTEUR_GENERAL,
  ];

  hasFonction(slugFonction: string | string[]): boolean {
    const userFonctionSlug = this.userData?.employe?.fonction?.slug;
    if (!userFonctionSlug) return false;

    if (Array.isArray(slugFonction)) {
      return slugFonction.includes(userFonctionSlug);
    }
    return userFonctionSlug === slugFonction;
  }

  canAccessCaisse(): boolean {
    if (this.isAdmin()) return true;

    return this.hasFonction(this.CAISSE_FONCTIONS);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Retourne la largeur de la sidebar
   */
  getSidebarClasses(): string {
    const classes = [];
    if (!this.isSidebarOpen) classes.push('sidebar-closed');
    if (this.isSidebarOpen) classes.push('sidebar-open');
    return classes.join(' ');
  }

  /**
   * Retourne les classes CSS selon l'état
   */
  getSidebarWidth(): string {
    return ''; // ← vide, on laisse le CSS gérer
  }

  toggleSection(section: string) {
    this.openSection = this.openSection === section ? null : section;
  }

  isAdmin(): boolean {
    return this.authSvr.isDG();
  }
}
