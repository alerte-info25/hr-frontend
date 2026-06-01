import { Component } from '@angular/core';
import { InfrasSidebarComponent } from "./infras-sidebar/infras-sidebar.component";
import { NavigationEnd, Router, RouterModule, RouterOutlet } from "@angular/router";
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../material.module';
import { NavbarComponent } from '../navbar/navbar.component';
import { Subject, takeUntil, filter } from 'rxjs';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'app-infras-layout',
  imports: [
    InfrasSidebarComponent,
    NavbarComponent,
    MaterialModule,
    RouterModule,
    CommonModule],
  templateUrl: './infras-layout.component.html',
  styleUrl: './infras-layout.component.scss'
})
export class InfrasLayoutComponent {
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
