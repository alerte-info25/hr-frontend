import { TestBed } from '@angular/core/testing';

import { CategorieComptableService } from './categorie-comptable.service';

describe('CategorieComptableService', () => {
  let service: CategorieComptableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategorieComptableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
