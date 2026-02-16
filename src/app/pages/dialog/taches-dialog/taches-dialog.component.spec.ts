import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TachesDialogComponent } from './taches-dialog.component';

describe('TachesDialogComponent', () => {
  let component: TachesDialogComponent;
  let fixture: ComponentFixture<TachesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TachesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TachesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
