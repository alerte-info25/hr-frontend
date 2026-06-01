import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasLayoutComponent } from './infras-layout.component';

describe('InfrasLayoutComponent', () => {
  let component: InfrasLayoutComponent;
  let fixture: ComponentFixture<InfrasLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
