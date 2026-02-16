import { Component } from '@angular/core';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { NavbarComponent } from '../navbar/navbar.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../../material.module';
import { filter, Subject, takeUntil } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [
    SidebarComponent,
    NavbarComponent,
    MaterialModule,
    RouterModule,
    CommonModule
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  private destroy$ = new Subject<void>();
  isSidebarOpen = true;

  constructor(
    public sidebarService: SidebarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements d'état de la sidebar
    this.sidebarService.sidebarState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        this.isSidebarOpen = isOpen;
      });
      this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Ici tu récupères la route actuelle
        const url = event.urlAfterRedirects;
        this.currentRouteName = this.formatRouteName(url);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Retourne les classes CSS pour le wrapper principal
   */
  getMainClasses(): string {
    return this.isSidebarOpen ? 'sidebar-open' : 'sidebar-closed';
  }

  currentRouteName: string = '';


  formatRouteName(url: string): string {
    // Supprime le slash initial et remplace les "-" par des espaces
    return url === '/' ? '' : url.replace('/', '').replace('-', ' ').toUpperCase();
  }
}
