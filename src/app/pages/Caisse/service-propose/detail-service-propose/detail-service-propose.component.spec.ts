import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailServiceProposeComponent } from './detail-service-propose.component';

describe('DetailServiceProposeComponent', () => {
  let component: DetailServiceProposeComponent;
  let fixture: ComponentFixture<DetailServiceProposeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailServiceProposeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailServiceProposeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
