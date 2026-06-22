import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../../../../material.module';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
  selector: 'app-infras-sidebar',
  imports: [MaterialModule, CommonModule, RouterLink],
  templateUrl: './infras-sidebar.component.html',
  styleUrl: './infras-sidebar.component.scss'
})
export class InfrasSidebarComponent implements OnInit, OnDestroy {
  userData: any = null;
  private destroy$ = new Subject<void>();
  isSidebarOpen = true;
  filteredMenuList: any[] = [];

  private allMenuList = [
    {
     name: 'Accueil',
     icon: 'home',
     route: '/accueil',
     requireDG: false
    },
    {
      name: 'Dashboard',
      icon: 'assessment',
      route: '/infrastructures/dashboard',
      requireDG: true
    },
    {
      name: 'Équipements',
      icon: 'devices',
      route: '/infrastructures/equipements',
      requireDG: false
    },
    {
      name: 'Employés',
      icon: 'person',
      route: '/infrastructures/employes',
      requireDG: true
    },
    {
      name: 'Bureaux',
      icon: 'apartment',
      route: '/infrastructures/bureaux',
      requireDG: true
    },
    {
      name: 'Pièces',
      icon: 'domain',
      route: '/infrastructures/pieces',
      requireDG: false
    },
    {
      name: 'Categories',
      icon: 'category',
      route: '/infrastructures/categories',
      requireDG: true
    },
    {
      name: 'Affectations',
      icon: 'assignment_ind',
      route: '/infrastructures/affectations',
      requireDG: false
    },
    {
      name: 'Mouvements',
      icon: 'swap_horiz',
      route: '/infrastructures/mouvements',
      requireDG: false
    },
    // {
    //   name: 'Fournisseurs',
    //   icon: 'business',
    //   route: '/infrastructures/fournisseurs',
    //   requireDG: true
    // }
  ];

  constructor(
    private sidebarService: SidebarService,
    private authSvr: AuthService,
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'état de la sidebar
    this.sidebarService.sidebarState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOpen) => {
        this.isSidebarOpen = isOpen;
      });

    // S'abonner aux changements de l'utilisateur
    this.authSvr.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.userData = user;
        this.filterMenu();
      });
  }

  /**
   * Filtre les menus selon les droits de l'utilisateur
   */
  private filterMenu(): void {
    this.filteredMenuList = this.allMenuList.filter(menu => {
      // Si le menu ne requiert pas d'être DG, tout le monde le voit
      if (!menu.requireDG) {
        return true;
      }
      // Si le menu requiert d'être DG, vérifier si l'utilisateur est DG
      return this.authSvr.isDG();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Retourne les classes de la sidebar
   */
  getSidebarClasses(): string {
    const classes = [];
    if (!this.isSidebarOpen) classes.push('sidebar-closed');
    if (this.isSidebarOpen) classes.push('sidebar-open');
    return classes.join(' ');
  }
}
