import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SidebarService } from '../../services/sidebar.service';
import { MaterialModule } from '../../../../material.module';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  imports: [MaterialModule,MatMenuModule, MatButtonModule, MatIconModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Données utilisateur
  userData: any = null;



  // Notifications email
  emailNotificationCount = 3;

  // État de la sidebar pour les animations CSS
  isSidebarOpen = true;

  constructor(
    private router: Router,
    private sidebarService: SidebarService,
    private authSvr: AuthService
  ) {}

  ngOnInit(): void {
    this.authSvr.user$.subscribe(user => {
      this.userData = user;
    });
    this.loadUserData();
    this.subscribeToSidebarState();
    const storedUser = localStorage.getItem('user_token');
    if (storedUser) {
      this.userData = JSON.parse(storedUser);
    }
  }

  goToProfil() {
    this.router.navigate(['employee-profile']);
  }

  logout(){
    this.authSvr.logout()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle l'état de la sidebar via le service
   * Cette fonction gère à la fois la réduction de la sidebar et l'élargissement de la navbar
   */
  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();

    // Animation supplémentaire pour la navbar si nécessaire
    this.animateNavbarExpansion();
  }

  /**
   * Animation pour l'expansion de la navbar
   */
  private animateNavbarExpansion(): void {
    // Ajouter une classe CSS temporaire pour l'animation
    const navbarElement = document.querySelector('.app-header-area') as HTMLElement;
    if (navbarElement) {
      navbarElement.classList.add('navbar-transitioning');

      // Retirer la classe après l'animation
      setTimeout(() => {
        navbarElement.classList.remove('navbar-transitioning');
      }, 300);
    }
  }

  /**
   * Retourne la marge gauche de la navbar selon l'état de la sidebar
   */
  sidebarWidth(): string {
    return this.sidebarService.getNavbarMarginLeft();
  }

  /**
   * S'abonne aux changements d'état de la sidebar
   */
  private subscribeToSidebarState(): void {
    this.sidebarService.sidebarState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOpen => {
        this.isSidebarOpen = isOpen;
      });
  }
  getUserPhoto(): string {
  return this.userData?.employe?.photo_url
    ? this.userData.employe.photo_url
    : 'assets/images/avatar/my-avatar.png';
}

  /**
   * Gestion de la déconnexion
   */
  /**
   * Charge les données utilisateur
   */
  private loadUserData(): void {
    // Récupération des données utilisateur depuis un service
    // this.userService.getCurrentUser().pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe(user => {
    //   this.userData = user;
    // });
  }

  /**
   * Nettoie la session utilisateur
   */
  private clearUserSession(): void {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
  }

  /**
   * Getters pour les templates
   */
  get isLoggedIn(): boolean {
    return !!localStorage.getItem('userToken');
  }

  get userName(): string {
    return this.userData.name || 'Utilisateur';
  }

  get userStatus(): string {
    return this.userData.status || '';
  }

  /**
   * Méthodes de navigation
   */
  navigateToProfile(): void {
    this.router.navigate(['/employee-profile']);
  }

  navigateToChat(): void {
    this.router.navigate(['/app-chat']);
  }

  navigateToInbox(): void {
    this.router.navigate(['/email-inbox']);
  }

  navigateToCompose(): void {
    this.router.navigate(['/email-compose']);
  }

  navigateToSignup(): void {
    this.router.navigate(['/signup-basic']);
  }
}
