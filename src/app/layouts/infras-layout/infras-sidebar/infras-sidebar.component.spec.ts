import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasSidebarComponent } from './infras-sidebar.component';

describe('InfrasSidebarComponent', () => {
  let component: InfrasSidebarComponent;
  let fixture: ComponentFixture<InfrasSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
