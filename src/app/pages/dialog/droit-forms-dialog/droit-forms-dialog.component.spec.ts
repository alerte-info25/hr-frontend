import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DroitFormsDialogComponent } from './droit-forms-dialog.component';

describe('DroitFormsDialogComponent', () => {
  let component: DroitFormsDialogComponent;
  let fixture: ComponentFixture<DroitFormsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DroitFormsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DroitFormsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
