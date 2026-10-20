import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
@Component({
  selector: 'app-access-denied',
  imports: [CommonModule],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss'
})
export class AccessDeniedComponent {
  private router = inject(Router);
  private location = inject(Location);

  @Input() requiredRoles: string[] = [];
  @Input() userRole: string = '';

  goBack(): void {
    this.location.back();
  }

  goHome(): void {
    this.router.navigate(['/applications']);
  }
}
