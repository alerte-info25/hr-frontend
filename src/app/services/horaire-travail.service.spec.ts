import { TestBed } from '@angular/core/testing';

import { HoraireTravailService } from './horaire-travail.service';

describe('HoraireTravailService', () => {
  let service: HoraireTravailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HoraireTravailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
