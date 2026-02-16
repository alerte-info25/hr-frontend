import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaisseModuleComponent } from './caisse-module.component';

describe('CaisseModuleComponent', () => {
  let component: CaisseModuleComponent;
  let fixture: ComponentFixture<CaisseModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaisseModuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaisseModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
