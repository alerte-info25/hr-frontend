import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CongesDirecteurComponent } from './conges-directeur.component';

describe('CongesDirecteurComponent', () => {
  let component: CongesDirecteurComponent;
  let fixture: ComponentFixture<CongesDirecteurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CongesDirecteurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CongesDirecteurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
