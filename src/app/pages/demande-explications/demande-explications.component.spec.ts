import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeExplicationsComponent } from './demande-explications.component';

describe('DemandeExplicationsComponent', () => {
  let component: DemandeExplicationsComponent;
  let fixture: ComponentFixture<DemandeExplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemandeExplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemandeExplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
