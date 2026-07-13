import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailTypeDepenseComponent } from './detail-type-depense.component';

describe('DetailTypeDepenseComponent', () => {
  let component: DetailTypeDepenseComponent;
  let fixture: ComponentFixture<DetailTypeDepenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailTypeDepenseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailTypeDepenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
