import { TestBed } from '@angular/core/testing';

import { RegisterCodesService } from './register-codes.service';

describe('RegisterCodesService', () => {
  let service: RegisterCodesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegisterCodesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
