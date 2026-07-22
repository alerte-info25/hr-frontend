import { TestBed } from '@angular/core/testing';

import { DurationCalculatorService } from './duration-calculator.service';

describe('DurationCalculatorService', () => {
  let service: DurationCalculatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DurationCalculatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
