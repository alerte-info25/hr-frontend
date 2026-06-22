import { TestBed } from '@angular/core/testing';

import { AlerteinfoService } from './alerteinfo.service';

describe('AlerteinfoService', () => {
  let service: AlerteinfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlerteinfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
