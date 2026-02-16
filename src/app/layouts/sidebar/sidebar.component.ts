  import { Component, OnInit, OnDestroy } from '@angular/core';
  import { Subject } from 'rxjs';
  import { takeUntil } from 'rxjs/operators';
  import { SidebarService } from '../../services/sidebar.service';// Ajustez le chemin
  import { MaterialModule } from '../../../../material.module';
  import { CommonModule } from '@angular/common';
  import { RouterLink } from '@angular/router';
  import { AuthService } from '../../services/auth.service';

  @Component({
    selector: 'app-sidebar',
    imports:[MaterialModule, CommonModule, RouterLink],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
  })
  export class SidebarComponent implements OnInit, OnDestroy {
    userRights: string[] = [];
    userData: any = JSON.parse(localStorage.getItem('user_token') || '{}');
    private destroy$ = new Subject<void>();
    isSidebarOpen = true;
    openSection: string | null = null;
    constructor(
      private sidebarService: SidebarService,
      private authSvr: AuthService
    ) {}

    ngOnInit(): void {
      // S'abonner aux changements d'état de la sidebar
      this.authSvr.user$.subscribe(user => {
        this.userData = user;
      });
      this.sidebarService.sidebarState$
        .pipe(takeUntil(this.destroy$))
        .subscribe(isOpen => {
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

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    /**
     * Retourne la largeur de la sidebar
     */
    getSidebarWidth(): string {
      return this.sidebarService.getSidebarWidth();
    }

    /**
     * Retourne les classes CSS selon l'état
     */
    getSidebarClasses(): string {
      return this.isSidebarOpen ? 'sidebar-open' : 'sidebar-closed';
    }


    toggleSection(section: string) {
      this.openSection = this.openSection === section ? null : section;
    }

    isAdmin(): boolean {
      return this.authSvr.isDG();
    }

  }
