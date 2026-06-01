import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-infras-loading',
  imports: [],
  templateUrl: './infras-loading.component.html',
  styleUrl: './infras-loading.component.scss'
})
export class InfrasLoadingComponent {
  @Input() isVisible = true;
  @Input() loadingTitle = 'Chargement en cours';
  @Input() loadingSubtitle = 'Veuillez patienter pendant que nous récupérons vos données...';
  @Input() progress = 0;
  @Input() currentStep = 1;

  particles: Array<{x: number, y: number, delay: number}> = [];

  constructor() {
    this.generateParticles();
  }

  private generateParticles() {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + Math.random() * 100,
        delay: Math.random() * 6
      });
    }
  }
}
