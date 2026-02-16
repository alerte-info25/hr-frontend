import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsDemandesExplicationsComponent } from './details-demandes-explications.component';

describe('DetailsDemandesExplicationsComponent', () => {
  let component: DetailsDemandesExplicationsComponent;
  let fixture: ComponentFixture<DetailsDemandesExplicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsDemandesExplicationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsDemandesExplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
