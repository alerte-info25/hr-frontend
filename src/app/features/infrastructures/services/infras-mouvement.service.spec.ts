import { TestBed } from '@angular/core/testing';

import { InfrasMouvementService } from './infras-mouvement.service';

describe('InfrasMouvementService', () => {
  let service: InfrasMouvementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfrasMouvementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
