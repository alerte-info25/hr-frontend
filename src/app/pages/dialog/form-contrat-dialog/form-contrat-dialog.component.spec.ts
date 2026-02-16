import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormContratDialogComponent } from './form-contrat-dialog.component';

describe('FormContratDialogComponent', () => {
  let component: FormContratDialogComponent;
  let fixture: ComponentFixture<FormContratDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormContratDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormContratDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
