import { TestBed } from '@angular/core/testing';

import { PermananceService } from './permanance.service';

describe('PermananceService', () => {
  let service: PermananceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermananceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
