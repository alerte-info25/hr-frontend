import { TestBed } from '@angular/core/testing';

import { OperationComptableServiceService } from './operation-comptable-service.service';

describe('OperationComptableServiceService', () => {
  let service: OperationComptableServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OperationComptableServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
