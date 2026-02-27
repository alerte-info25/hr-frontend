import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

export interface Notification {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  @Input() userName = 'Comptable';
  @Input() avatarUrl = 'https://via.placeholder.com/30';

  @Output() toggleSidebar = new EventEmitter<void>();

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

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

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/avatar/my-avatar.png';
  }

  logout() {
    this.authSvr.logout();
  }
}
