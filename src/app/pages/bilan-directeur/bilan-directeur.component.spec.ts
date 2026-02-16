import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilanDirecteurComponent } from './bilan-directeur.component';

describe('BilanDirecteurComponent', () => {
  let component: BilanDirecteurComponent;
  let fixture: ComponentFixture<BilanDirecteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilanDirecteurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilanDirecteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
