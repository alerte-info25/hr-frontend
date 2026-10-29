import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermananceAdminComponent } from './permanance-admin.component';

describe('PermananceAdminComponent', () => {
  let component: PermananceAdminComponent;
  let fixture: ComponentFixture<PermananceAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermananceAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermananceAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
