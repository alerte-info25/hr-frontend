import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceProposeComponent } from './service-propose.component';

describe('ServiceProposeComponent', () => {
  let component: ServiceProposeComponent;
  let fixture: ComponentFixture<ServiceProposeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceProposeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceProposeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
