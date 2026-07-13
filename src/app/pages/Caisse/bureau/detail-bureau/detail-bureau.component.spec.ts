import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailBureauComponent } from './detail-bureau.component';

describe('DetailBureauComponent', () => {
  let component: DetailBureauComponent;
  let fixture: ComponentFixture<DetailBureauComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailBureauComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailBureauComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
