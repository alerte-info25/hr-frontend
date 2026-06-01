import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasBureauxComponent } from './infras-bureaux.component';

describe('InfrasBureauxComponent', () => {
  let component: InfrasBureauxComponent;
  let fixture: ComponentFixture<InfrasBureauxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasBureauxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasBureauxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
