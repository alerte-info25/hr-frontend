import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { MaterialModule } from '../../../../../material.module';

@Component({
  selector: 'app-infras-navbar',
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './infras-navbar.component.html',
  styleUrl: './infras-navbar.component.scss',
  animations: [
    trigger('dropDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px) scale(0.97)' }),
        animate('200ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0) scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ])
    ])
  ],
})
export class InfrasNavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  sidebarCollapsed = false;
  showNotifications = false;
  showUserMenu = false;


  onToggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.toggleSidebar.emit();
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }


}
