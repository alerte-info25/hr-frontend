import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FONCTIONS } from '../../models/Caisse/verification-fonction.model';

@Injectable({
  providedIn: 'root',
})
export class CaisseGuard implements CanActivate {
  private readonly CAISSE_FONCTIONS = [
    FONCTIONS.COMPTABLE,
    FONCTIONS.COMMERCIALE,
    FONCTIONS.DIRECTEUR_GENERAL,
  ];

  constructor(
    private authSvr: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean {
    const userData = JSON.parse(localStorage.getItem('user_token') || '{}');
    const userSlug = userData?.employe?.fonction?.slug;

    const isAuthorized =
      this.authSvr.isDG() || this.CAISSE_FONCTIONS.includes(userSlug);

    if (!isAuthorized) {
      this.router.navigate(['/applications']); 
      return false;
    }

    return true;
  }
}
