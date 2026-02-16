import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjetsComponent } from './objets.component';

describe('ObjetsComponent', () => {
  let component: ObjetsComponent;
  let fixture: ComponentFixture<ObjetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ObjetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObjetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
