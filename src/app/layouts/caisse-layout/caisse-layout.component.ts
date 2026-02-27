import { Component, HostListener, OnInit } from '@angular/core';
import { LoaderComponent } from '../../sharedCaisse/components/loader/loader.component';
import { SidebarComponent } from '../../sharedCaisse/components/sidebar/sidebar.component';
import { NavbarComponent } from '../../sharedCaisse/components/navbar/navbar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-caisse-layout',
  imports: [LoaderComponent, SidebarComponent, NavbarComponent, RouterModule],
  templateUrl: './caisse-layout.component.html',
  styleUrls: ['./caisse-layout.component.scss'],
})
export class CaisseLayoutComponent implements OnInit {
  sidebarToggled = false; 
  isMobile = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    // Sur mobile, sidebar fermée par défaut
    if (this.isMobile) {
      this.sidebarToggled = false;
    } else {
      this.sidebarToggled = true;
    }
  }

  onToggleSidebar() {
    this.sidebarToggled = !this.sidebarToggled;
  }

  handleLogout() {
    // ta logique logout
  }
}
