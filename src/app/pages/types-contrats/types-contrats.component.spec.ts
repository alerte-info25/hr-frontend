import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypesContratsComponent } from './types-contrats.component';

describe('TypesContratsComponent', () => {
  let component: TypesContratsComponent;
  let fixture: ComponentFixture<TypesContratsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypesContratsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypesContratsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
