import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasNavbarComponent } from './infras-navbar.component';

describe('InfrasNavbarComponent', () => {
  let component: InfrasNavbarComponent;
  let fixture: ComponentFixture<InfrasNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
