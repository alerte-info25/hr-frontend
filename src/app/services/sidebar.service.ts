import { Injectable } from '@angular/core';
import { BehaviorSubject, debounceTime, fromEvent, Observable, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
    // État de la sidebar (true = ouverte, false = fermée)
  private sidebarStateSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public sidebarState$: Observable<boolean> = this.sidebarStateSubject.asObservable();

  // État du mode mobile
  private isMobileSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(window.innerWidth <= 768);
  public isMobile$: Observable<boolean> = this.isMobileSubject.asObservable();
  constructor() {
     fromEvent(window, 'resize')
      .pipe(debounceTime(150), startWith(null))
      .subscribe(() => {
        const isNowMobile = window.innerWidth <= 768;
        this.isMobileSubject.next(isNowMobile);

        // Fermer la sidebar si on passe en mode mobile
        if (isNowMobile) this.closeSidebar();
      });
  }

  /**
   * Toggle l'état de la sidebar
   */
  toggleSidebar(): void {
    const currentState = this.sidebarStateSubject.value;
    this.sidebarStateSubject.next(!currentState);
  }

  /**
   * Ouvre la sidebar
   */
  openSidebar(): void {
    this.sidebarStateSubject.next(true);
  }

  /**
   * Ferme la sidebar
   */
  closeSidebar(): void {
    this.sidebarStateSubject.next(false);
  }

  /**
   * Retourne l'état actuel de la sidebar
   */
  get isOpen(): boolean {
    return this.sidebarStateSubject.value;
  }

  /**
   * Retourne la largeur de la sidebar selon son état
   */
  // getSidebarWidth(): string {
  //   return this.isOpen ? '280px' : '112px'; // 60% de réduction : 280px -> 112px
  // }
  getSidebarWidth(): string {
    if (this.isMobileSubject.value) return this.isOpen ? '240px' : '0px';
    return this.isOpen ? '280px' : '112px';
  }

  getNavbarMarginLeft(): string {
    if (this.isMobileSubject.value) return '0px';
    return this.getSidebarWidth();
  }
  getContentMarginLeft(): string {
    if (this.isMobileSubject.value) return '0px';
    return this.getSidebarWidth();
  }
  /**
   * Retourne la marge gauche pour la navbar
   */
  // getNavbarMarginLeft(): string {
  //   return this.getSidebarWidth();
  // }
    /**
   * Retourne la marge gauche pour le contenu principal
   */
  // getContentMarginLeft(): string {
  //   return this.getSidebarWidth();
  // }

}
