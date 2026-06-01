import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignEquipementComponent } from './assign-equipement.component';

describe('AssignEquipementComponent', () => {
  let component: AssignEquipementComponent;
  let fixture: ComponentFixture<AssignEquipementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignEquipementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignEquipementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
