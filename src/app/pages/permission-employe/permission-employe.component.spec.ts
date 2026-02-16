import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionEmployeComponent } from './permission-employe.component';

describe('PermissionEmployeComponent', () => {
  let component: PermissionEmployeComponent;
  let fixture: ComponentFixture<PermissionEmployeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionEmployeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionEmployeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
