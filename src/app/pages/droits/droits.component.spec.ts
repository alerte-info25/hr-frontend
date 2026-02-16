import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DroitsComponent } from './droits.component';

describe('DroitsComponent', () => {
  let component: DroitsComponent;
  let fixture: ComponentFixture<DroitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DroitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DroitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
