import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormComponent } from './form/form.component';
import { CompteComptableService } from '../../../../services/Caisse/compte-comptable.service';
import { CompteComptableModel } from '../../../../models/Caisse/compte-comptable.model';
import { LoaderComponent } from '../../../../sharedCaisse/components/loader/loader.component';

@Component({
  selector: 'app-add-compte',
  imports: [RouterLink, FormComponent, LoaderComponent],
  templateUrl: './add-compte.component.html',
  styleUrl: './add-compte.component.scss',
})
export class AddCompteComponent implements OnInit {
  route = inject(ActivatedRoute);
  compteComptableService = inject(CompteComptableService);
  compteRfk = signal<string | null>(null);
  compteComptable = signal<CompteComptableModel | null>(null);

  // gestion des erreurs
  success = signal(false);
  loader = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const rfk = this.route.snapshot.paramMap.get('rfk');
    this.compteRfk.set(rfk);

    if (rfk) {
      this.loadAccount(rfk);
    }
    console.log(this.compteRfk());
  }

  loadAccount = (rfk: string) => {
    this.loader.set(true);

    this.compteComptableService.getOne(rfk).subscribe({
      next: (data) => {
        this.success.set(true);
        this.loader.set(false);
        this.compteComptable.set(data);

        setTimeout(() => {
          this.success.set(false);
        }, 3000);
      },
      error: (err) => {
        this.errorMessage.set(err.error.message ?? 'Une erreur est survenue');
        this.loader.set(false);
      },
    });
  };

}
