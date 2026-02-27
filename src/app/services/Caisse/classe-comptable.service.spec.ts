import { TestBed } from '@angular/core/testing';

import { ClasseComptableService } from './classe-comptable.service';

describe('ClasseComptableService', () => {
  let service: ClasseComptableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClasseComptableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
