import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionArchiveComponent } from './permission-archive.component';

describe('PermissionArchiveComponent', () => {
  let component: PermissionArchiveComponent;
  let fixture: ComponentFixture<PermissionArchiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionArchiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionArchiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
