import { TestBed } from '@angular/core/testing';

import { ServiceProposeService } from './service-propose.service';

describe('ServiceProposeService', () => {
  let service: ServiceProposeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceProposeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
