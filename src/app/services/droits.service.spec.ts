import { TestBed } from '@angular/core/testing';

import { DroitsService } from './droits.service';

describe('DroitsService', () => {
  let service: DroitsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DroitsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
