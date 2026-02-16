import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeveloppeurRapportComponent } from './developpeur-rapport.component';

describe('DeveloppeurRapportComponent', () => {
  let component: DeveloppeurRapportComponent;
  let fixture: ComponentFixture<DeveloppeurRapportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeveloppeurRapportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeveloppeurRapportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
