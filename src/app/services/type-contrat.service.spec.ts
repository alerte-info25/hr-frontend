import { TestBed } from '@angular/core/testing';

import { TypeContratService } from './type-contrat.service';

describe('TypeContratService', () => {
  let service: TypeContratService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeContratService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
