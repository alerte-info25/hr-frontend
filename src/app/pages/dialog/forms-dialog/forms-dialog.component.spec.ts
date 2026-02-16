import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsDialogComponent } from './forms-dialog.component';

describe('FormsDialogComponent', () => {
  let component: FormsDialogComponent;
  let fixture: ComponentFixture<FormsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
