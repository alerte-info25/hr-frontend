import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServService {

  constructor() { }

  getContratTypeLabel(type: number): string {
    switch(type){
      case 1: return 'CDI'
      case 2: return 'CDD'
      case 3: return 'Freelance'
      case 4: return 'Intérim'
      case 5: return 'Stage'
      default: return 'Inconnu'
    }
  }

  getContratTypeClass(type: number): string {
    switch (type) {
      case 1: return "badge rounded-pill bg-success";
      case 2: return "badge rounded-pill bg-primary";
      case 3: return "badge rounded-pill bg-dark";
      case 4: return "badge rounded-pill bg-warning text-dark";
      case 5: return "badge rounded-pill bg-info text-dark";

      default:
        return "badge rounded-pill bg-secondary"

    }
  }
}
