import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuEquipementComponent } from './cu-equipement.component';

describe('CuEquipementComponent', () => {
  let component: CuEquipementComponent;
  let fixture: ComponentFixture<CuEquipementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuEquipementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuEquipementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
