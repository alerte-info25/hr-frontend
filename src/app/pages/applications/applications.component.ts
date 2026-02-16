import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-applications',
  imports: [CommonModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss'
})
export class ApplicationsComponent {

  userRights: string[] = [];
  userRole: string = '';
  userService: string = '';
  isLoading = true;
  constructor(
    private router: Router,
    private dialog:  MatDialog,
    private authSvr: AuthService
  ) {}

  ngOnInit(): void {
    const user = localStorage.getItem('user_token');
    if (user) {
      const userData = JSON.parse(user);
      const employe = userData?.employe || null;
      // On récupère la chaîne de droits
      const droitsString = userData?.role?.droits?.libelle || '';
      this.userRole = userData?.role?.libelle || '';
      this.userService = employe?.service?.nom || 'Service inconnu'
      this.userRights = droitsString.split('-'); // transforme en tableau
    }
  }
  hasRight(moduleName: string): boolean {
    return this.userRights.includes(moduleName);
  }
  // Redirection vers un module
  goTo(path: string) {
    this.router.navigate([path]);
  }
  goToPermissions() {
    if (this.userRole.toLocaleLowerCase() === 'employe' || this.userRole.toLocaleLowerCase() === 'employé') {
      this.router.navigate(['/mes-permissions']);
    } else {
      this.router.navigate(['/permissions']);
    }
  }

  goToDossiers() {
    if (this.userRole.toLocaleLowerCase() === 'employe' || this.userRole.toLocaleLowerCase() === 'employé') {
      const slug = this.authSvr.getCurrentUser().employe.slug;

      this.router.navigate(['/dossier', slug]);
    } else {
      this.router.navigate(['/dossiers']);
    }
  }

  goToConges(){
    if (this.userRole.toLocaleLowerCase() === 'employe' || this.userRole.toLocaleLowerCase() === 'employé') {
      const slug = this.authSvr.getCurrentUser().employe.slug;

      this.router.navigate(['/mes-conges']);
    } else {
      this.router.navigate(['/conges']);
    }
  }

  goToRapport(){
    // this.router.navigate(['/mes-bilans']);
    if (this.userRole.toLocaleLowerCase() === 'directeur') {
      this.router.navigate(['/bilans-trimestriel']);
    } else {
      this.router.navigate(['/mes-bilans']);
    }
  }

  gotoCahierChares(){
    if (this.userRole.toLocaleLowerCase() === 'directeur') {
      this.router.navigate(['/cahiers-charges']);
    } else {
      this.router.navigate(['/mes-cahiers']);
    }
  }

  isDevOrDir(){
    return this.authSvr.isDG() ||
      this.userService === 'Développement' ||
      this.userService === 'Developpement';
  }

  goToPrime(){
    if (this.userRole.toLocaleLowerCase() === 'employe' || this.userRole.toLocaleLowerCase() === 'employé') {
      this.router.navigate(['/mes-primes']);
    } else {
      this.router.navigate(['/suivi-primes']);
    }
  }


}
