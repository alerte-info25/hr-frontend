import { TestBed } from '@angular/core/testing';

import { TypeCompteComptableService } from './type-compte-comptable.service';

describe('TypeCompteComptableService', () => {
  let service: TypeCompteComptableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeCompteComptableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
