import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermananceResponsableComponent } from './permanance-responsable.component';

describe('PermananceResponsableComponent', () => {
  let component: PermananceResponsableComponent;
  let fixture: ComponentFixture<PermananceResponsableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermananceResponsableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermananceResponsableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
