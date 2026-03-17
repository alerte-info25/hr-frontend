import { TestBed } from '@angular/core/testing';

import { RecouvrementService } from './recouvrement.service';

describe('RecouvrementService', () => {
  let service: RecouvrementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecouvrementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
