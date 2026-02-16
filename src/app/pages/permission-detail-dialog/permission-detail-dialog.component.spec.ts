import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionDetailDialogComponent } from './permission-detail-dialog.component';

describe('PermissionDetailDialogComponent', () => {
  let component: PermissionDetailDialogComponent;
  let fixture: ComponentFixture<PermissionDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
