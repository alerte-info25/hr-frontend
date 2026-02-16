import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypePermissionComponent } from './type-permission.component';

describe('TypePermissionComponent', () => {
  let component: TypePermissionComponent;
  let fixture: ComponentFixture<TypePermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypePermissionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypePermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
