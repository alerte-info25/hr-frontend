import { TestBed } from '@angular/core/testing';

import { DashboardCaisseService } from './dashboard-caisse.service';

describe('DashboardCaisseService', () => {
  let service: DashboardCaisseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardCaisseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
