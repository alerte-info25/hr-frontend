import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CahiersDirecteurComponent } from './cahiers-directeur.component';

describe('CahiersDirecteurComponent', () => {
  let component: CahiersDirecteurComponent;
  let fixture: ComponentFixture<CahiersDirecteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CahiersDirecteurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CahiersDirecteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
