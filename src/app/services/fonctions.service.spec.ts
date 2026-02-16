import { TestBed } from '@angular/core/testing';

import { FonctionsService } from './fonctions.service';

describe('FonctionsService', () => {
  let service: FonctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FonctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
