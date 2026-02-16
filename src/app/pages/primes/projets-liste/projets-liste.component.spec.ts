import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjetsListeComponent } from './projets-liste.component';

describe('ProjetsListeComponent', () => {
  let component: ProjetsListeComponent;
  let fixture: ComponentFixture<ProjetsListeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjetsListeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjetsListeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
