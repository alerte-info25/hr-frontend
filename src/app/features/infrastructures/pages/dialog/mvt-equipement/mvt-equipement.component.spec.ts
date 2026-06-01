import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MvtEquipementComponent } from './mvt-equipement.component';

describe('MvtEquipementComponent', () => {
  let component: MvtEquipementComponent;
  let fixture: ComponentFixture<MvtEquipementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MvtEquipementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MvtEquipementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
