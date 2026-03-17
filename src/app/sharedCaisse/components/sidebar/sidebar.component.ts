import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  active?: boolean;
  children?: NavItem[];
  separator?: boolean; // ligne séparatrice de section
  sectionTitle?: string; // titre de groupe
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  @Input() isToggled = false;
  @Input() progressValue = 75;

  @Input() navItems: NavItem[] = [
    //  TABLEAU DE BORD 
    {
      label: 'Accueil',
      icon: 'fas fa-home',
      route: '/applications',
    },
    {
      label: 'Tableau de bord',
      icon: 'fas fa-chart-pie',
      route: '/caisse',
    },

    //  OPÉRATIONS 
    {
      sectionTitle: 'Opérations',
      icon: '',
      label: '',
    },
    {
      label: 'Gestion des dépenses',
      icon: 'fa-solid fa-arrow-trend-down',
      route: '/caisse/depenses',
    },
    {
      label: 'Gestion des recouvrement',
      icon: 'fa-solid fa-arrow-trend-up',
      route: '/caisse/recouvrements',
    },

    //  RÉFÉRENTIELS 
    {
      sectionTitle: 'Référentiels',
      icon: '',
      label: '',
    },
    {
      label: 'Bureaux',
      icon: 'fa-solid fa-building',
      route: '/caisse/bureaux',
    },
    {
      label: 'Exercices comptables',
      icon: 'fa-solid fa-calendar-days',
      route: '/caisse/exercices',
    },
    {
      label: 'Gestion des comptes',
      icon: 'fa-solid fa-table-list',
      route: '/caisse/comptes',
    },
    {
      label: 'Périodes',
      icon: 'fa-solid fa-calendar-week',
      route: '/caisse/periodes',
    },
    {
      label: 'Types de dépenses',
      icon: 'fa-solid fa-tags',
      route: '/caisse/types-depenses',
    },
    {
      label: 'Services proposés',
      icon: 'fa-solid fa-briefcase',
      route: '/caisse/services-propose',
    },

    //  TIERS 
    {
      sectionTitle: 'Tiers',
      icon: '',
      label: '',
    },
    {
      label: 'Clients',
      icon: 'fa-solid fa-users',
      route: '/caisse/clients',
    },
    {
      label: 'Fournisseurs',
      icon: 'fa-solid fa-truck',
      route: '/caisse/fournisseurs',
    },

    //  RAPPORTS 
    // {
    //   sectionTitle: 'Rapports',
    //   icon: '',
    //   label: '',
    // },
    // {
    //   label: 'Rapport des dépenses',
    //   icon: 'fa-solid fa-file-invoice',
    //   route: '/caisse/rapports/depenses',
    // },
    // {
    //   label: 'Rapport des recouvrements',
    //   icon: 'fa-solid fa-file-invoice-dollar',
    //   route: '/caisse/rapports/recouvrements',
    // },
    {
      label: 'Bilan par bureau',
      icon: 'fa-solid fa-chart-bar',
      route: '/caisse/rapports/bilan-bureaux',
    },
    {
      label: 'Bilan par exercice',
      icon: 'fa-solid fa-chart-column',
      route: '/caisse/rapports/bilan-exercice',
    },
  ];

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

  isSection(item: NavItem): boolean {
    return !!item.sectionTitle;
  }
}
