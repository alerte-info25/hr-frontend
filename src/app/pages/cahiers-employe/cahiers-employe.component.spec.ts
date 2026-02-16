import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CahiersEmployeComponent } from './cahiers-employe.component';

describe('CahiersEmployeComponent', () => {
  let component: CahiersEmployeComponent;
  let fixture: ComponentFixture<CahiersEmployeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CahiersEmployeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CahiersEmployeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
