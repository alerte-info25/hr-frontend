import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfrasFournisseurComponent } from './infras-fournisseur.component';

describe('InfrasFournisseurComponent', () => {
  let component: InfrasFournisseurComponent;
  let fixture: ComponentFixture<InfrasFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfrasFournisseurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfrasFournisseurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
