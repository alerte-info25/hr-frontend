import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionCongesComponent } from './action-conges.component';

describe('ActionCongesComponent', () => {
  let component: ActionCongesComponent;
  let fixture: ComponentFixture<ActionCongesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionCongesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionCongesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
