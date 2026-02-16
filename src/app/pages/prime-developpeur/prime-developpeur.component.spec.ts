import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimeDeveloppeurComponent } from './prime-developpeur.component';

describe('PrimeDeveloppeurComponent', () => {
  let component: PrimeDeveloppeurComponent;
  let fixture: ComponentFixture<PrimeDeveloppeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimeDeveloppeurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrimeDeveloppeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
