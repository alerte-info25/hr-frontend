import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailContratComponent } from './detail-contrat.component';

describe('DetailContratComponent', () => {
  let component: DetailContratComponent;
  let fixture: ComponentFixture<DetailContratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailContratComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailContratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
