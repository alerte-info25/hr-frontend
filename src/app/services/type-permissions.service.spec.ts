import { TestBed } from '@angular/core/testing';

import { TypePermissionsService } from './type-permissions.service';

describe('TypePermissionsService', () => {
  let service: TypePermissionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypePermissionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
