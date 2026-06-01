import { TestBed } from '@angular/core/testing';

import { BureauxService } from './bureaux.service';

describe('BureauxService', () => {
  let service: BureauxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BureauxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
