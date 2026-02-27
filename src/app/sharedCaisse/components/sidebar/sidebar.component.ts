import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  @Input() isToggled = false;
  @Input() progressValue = 75;
  @Input() navItems: NavItem[] = [
    { label: 'Accueil', icon: 'fas fa-home', route: '/applications' },
    { label: 'Tableau de bord', icon: 'fas fa-chart-pie', route: '/caisse' },
    {
      label: 'Passer une écriture',
      icon: 'fa-solid fa-newspaper',
      route: '/caisse/new-journal',
    },
    {
      label: 'Liste des écritures',
      icon: 'fas fa-journal-whills',
      route: '/caisse/journal',
    },
    {
      label: 'Ajouter un bureaux',
      icon: 'fa-solid fa-circle-plus',
      route: '/caisse/new-bureaux',
    },
    {
      label: 'Liste des bureaux',
      icon: 'fa-solid fa-building',
      route: '/caisse/bureaux',
    },
    {
      label: 'Ajouter un compte',
      icon: 'fa-solid fa-calculator',
      route: '/caisse/add-compte',
    },
    {
      label: 'Listes des comptes',
      icon: 'fa-solid fa-file-invoice',
      route: '/caisse/comptes',
    },
    {
      label: 'Exercices comptables',
      icon: 'fa-solid fa-chart-column',
      route: '/caisse/exercices',
    },
  ];

  // Données utilisateur
  userData: any = null;

  constructor(
    private router: Router,
    private authSvr: AuthService,
  ) {}

  ngOnInit(): void {
    this.authSvr.user$.subscribe((user) => {
      this.userData = user;
    });
  }

  logout() {
    this.authSvr.logout();
  }
}
