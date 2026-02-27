import { TestBed } from '@angular/core/testing';

import { NatureOperationComptableService } from './nature-operation-comptable.service';

describe('NatureOperationComptableService', () => {
  let service: NatureOperationComptableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NatureOperationComptableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
