import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportEmployeComponent } from './rapport-employe.component';

describe('RapportEmployeComponent', () => {
  let component: RapportEmployeComponent;
  let fixture: ComponentFixture<RapportEmployeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportEmployeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportEmployeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
