import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasZonesComponent } from './infras-zones.component';

describe('InfrasZonesComponent', () => {
  let component: InfrasZonesComponent;
  let fixture: ComponentFixture<InfrasZonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasZonesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasZonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
