import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarCongeDetailsComponent } from './calendar-conge-details.component';

describe('CalendarCongeDetailsComponent', () => {
  let component: CalendarCongeDetailsComponent;
  let fixture: ComponentFixture<CalendarCongeDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarCongeDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarCongeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
