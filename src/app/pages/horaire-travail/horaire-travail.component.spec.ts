import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HoraireTravailComponent } from './horaire-travail.component';

describe('HoraireTravailComponent', () => {
  let component: HoraireTravailComponent;
  let fixture: ComponentFixture<HoraireTravailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoraireTravailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HoraireTravailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
