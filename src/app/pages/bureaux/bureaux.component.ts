import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormsDialogComponent } from '../dialog/forms-dialog/forms-dialog.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bureaux',
  imports: [CommonModule],
  templateUrl: './bureaux.component.html',
  styleUrl: './bureaux.component.scss'
})
export class BureauxComponent {
  bureaux: any[] = [
    { id: 1, nom: 'Bureau de marcory', acronyme:'MCRY' },
    { id: 2, nom: 'Burau du Burkina Faso', acronyme: 'BF' }
  ];

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void { }

  deleteRole(role: any) {
    // if (confirm(`Voulez-vous vraiment supprimer le rôle "${role.name}" ?`)) {
    //   this.roles = this.roles.filter(r => r.id !== role.id);
    // }
  }

     openAddDialog(): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'un bureau',
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'acronyme', label: 'Acronyme', type: 'text', validators: ['required'] }
        ]
      }
    });

    // dialogRef.afterClosed().subscribe(formData => {
    //   this.isLoading = true;
    //   if (formData) {
    //     this.podcastSvr.addPodcast(formData).subscribe(() => this.refresh());
    //   }
    // });
  }
  openEditDialog(bureau: any): void {
    const dialogRef = this.dialog.open(FormsDialogComponent, {
      width: 'auto',
      data: {
        title: 'une bureau',
        item: bureau,
        fields: [
          { name: 'nom', label: 'Nom', type: 'text', validators: ['required'] },
          { name: 'acronyme', label: 'Acronyme', type: 'text', validators: ['required'] }        ]
      }
    });

    // dialogRef.afterClosed().subscribe(formData => {
    //   if (formData) {
    //     this.isLoading = true;
    //     this.podcastSvr.update(podcast.slug, formData).subscribe(() => this.refresh());
    //   }
    // });
  }
}
