import { TestBed } from '@angular/core/testing';

import { CahierChargeService } from './cahier-charge.service';

describe('CahierChargeService', () => {
  let service: CahierChargeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CahierChargeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
