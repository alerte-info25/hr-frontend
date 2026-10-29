import { TestBed } from '@angular/core/testing';

import { PermananceAdminService } from './permanance-admin.service';

describe('PermananceAdminService', () => {
  let service: PermananceAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermananceAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
