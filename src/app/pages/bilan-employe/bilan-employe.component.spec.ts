import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilanEmployeComponent } from './bilan-employe.component';

describe('BilanEmployeComponent', () => {
  let component: BilanEmployeComponent;
  let fixture: ComponentFixture<BilanEmployeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilanEmployeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilanEmployeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
