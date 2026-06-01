import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasLoadingComponent } from './infras-loading.component';

describe('InfrasLoadingComponent', () => {
  let component: InfrasLoadingComponent;
  let fixture: ComponentFixture<InfrasLoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasLoadingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasLoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
