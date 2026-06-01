import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasAffectationComponent } from './infras-affectation.component';

describe('InfrasAffectationComponent', () => {
  let component: InfrasAffectationComponent;
  let fixture: ComponentFixture<InfrasAffectationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasAffectationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasAffectationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
