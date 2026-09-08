import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasDashboardComponent } from './infras-dashboard.component';

describe('InfrasDashboardComponent', () => {
  let component: InfrasDashboardComponent;
  let fixture: ComponentFixture<InfrasDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
