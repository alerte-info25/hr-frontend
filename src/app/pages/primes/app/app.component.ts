import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../../../material.module';

@Component({
  selector: 'app-app',
  imports: [CommonModule, MaterialModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  modules = [
    {
      title: 'Dashboard',
      description: 'Vue globale et statistiques',
      icon: 'dashboard',
      route: '/primes/dashboard'
    },
    {
      title: 'Projets',
      description: 'Suivi des projets liés aux primes',
      icon: 'folder',
      route: '/primes/projets'
    },
    {
      title: 'Rapport développeur',
      description: 'Performances et contributions',
      icon: 'engineering',
      route: '/primes/rapport-developpeur'
    },
    // {
    //   title: 'Primes',
    //   description: 'Gestion et historique des primes',
    //   icon: 'payments',
    //   route: '/primes/liste'
    // }
  ];

  constructor(private router: Router) {}

  goTo(route: string) {
    this.router.navigate([route]);
  }
}
