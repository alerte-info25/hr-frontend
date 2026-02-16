import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsBilanComponent } from './details-bilan.component';

describe('DetailsBilanComponent', () => {
  let component: DetailsBilanComponent;
  let fixture: ComponentFixture<DetailsBilanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsBilanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsBilanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
