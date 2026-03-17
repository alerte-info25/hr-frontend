import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCaisseComponent } from './dashboard-caisse.component';

describe('DashboardCaisseComponent', () => {
  let component: DashboardCaisseComponent;
  let fixture: ComponentFixture<DashboardCaisseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCaisseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCaisseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
