import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsMvtEquipementComponent } from './details-mvt-equipement.component';

describe('DetailsMvtEquipementComponent', () => {
  let component: DetailsMvtEquipementComponent;
  let fixture: ComponentFixture<DetailsMvtEquipementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsMvtEquipementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsMvtEquipementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
