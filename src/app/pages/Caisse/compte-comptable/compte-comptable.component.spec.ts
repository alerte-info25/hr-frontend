import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompteComptableComponent } from './compte-comptable.component';

describe('CompteComptableComponent', () => {
  let component: CompteComptableComponent;
  let fixture: ComponentFixture<CompteComptableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompteComptableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompteComptableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
