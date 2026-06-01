import { TestBed } from '@angular/core/testing';

import { InfrasEmployesService } from './infras-employes.service';

describe('InfrasEmployesService', () => {
  let service: InfrasEmployesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfrasEmployesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
