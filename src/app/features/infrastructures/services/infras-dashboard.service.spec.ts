import { TestBed } from '@angular/core/testing';

import { InfrasDashboardService } from './infras-dashboard.service';

describe('InfrasDashboardService', () => {
  let service: InfrasDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfrasDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
