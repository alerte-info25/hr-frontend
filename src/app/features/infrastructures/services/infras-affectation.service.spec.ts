import { TestBed } from '@angular/core/testing';

import { InfrasAffectationService } from './infras-affectation.service';

describe('InfrasAffectationService', () => {
  let service: InfrasAffectationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfrasAffectationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
