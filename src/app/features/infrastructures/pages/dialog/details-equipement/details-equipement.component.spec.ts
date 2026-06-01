import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsEquipementComponent } from './details-equipement.component';

describe('DetailsEquipementComponent', () => {
  let component: DetailsEquipementComponent;
  let fixture: ComponentFixture<DetailsEquipementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsEquipementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsEquipementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
