import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetsDetailsComponent } from './projets-details.component';

describe('ProjetsDetailsComponent', () => {
  let component: ProjetsDetailsComponent;
  let fixture: ComponentFixture<ProjetsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjetsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
