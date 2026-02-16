import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatOption } from '@angular/material/select';
import { MaterialModule } from "../../../../../material.module";

@Component({
  selector: 'app-droit-forms-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogActions,
    FormsModule,
    MatDialogContent,
    MatOption,
    MaterialModule
],
  templateUrl: './droit-forms-dialog.component.html',
  styleUrl: './droit-forms-dialog.component.scss'
})
export class DroitFormsDialogComponent {
  form!: FormGroup;
  isEditMode = false;
  toggleText = 'Tout cocher';
  allSelected = false;
  modules = [
    { value: 'employes', nom: 'Employés' },
    { value: 'services', nom: 'Services' },
    { value: 'contrats', nom: 'Contrats' },
    { value: 'type_contrat', nom: 'Type des contrats' },
    { value: 'permissions', nom: 'Permissions' },
    { value: 'type_permissions', nom: 'Type des permissions' },
    { value: 'fonction', nom: 'Fonction' },
    { value: 'conges', nom: 'Congés' },
    { value: 'type_conges', nom: 'Type des congés' },
    { value: 'taches', nom: 'Tâches' },
    { value: 'dossiers', nom: 'Dossiers' },
    { value: 'utilisateurs', nom: 'Utilisateurs' },
    { value: 'droits', nom: 'Droits' },
    { value: 'roles', nom: 'Rôles' },
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<DroitFormsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}



  ngOnInit(): void {
    this.isEditMode = !!this.data?.item;

    const group: { [key: string]: any } = {};

    // Récupérer les modules cochés si modification
    const checkedModules = this.data.item?.libelle?.split('-') || [];

    // Contrôle pour le rôle
    group['role'] = new FormControl(this.data.item?.role?.slug || '', Validators.required);

    // Contrôles pour les modules
    this.data.modules.forEach((module: any) => {
      const isChecked = checkedModules.includes(module.value);
      group[module.value] = new FormControl(isChecked);
    });

    this.form = new FormGroup(group);
    this.allSelected = this.data.modules.every((m: any) => checkedModules.includes(m.value));
  }
   // Toggle un module
  toggleModule(value: string, checked: boolean) {
    this.form.get(value)?.setValue(checked);
    this.allSelected = this.data.modules.every((m: any) => this.form.get(m.value)?.value);
    this.updateToggleText();
  }

  // Tout sélectionner / tout décocher
  toggleAllModules() {
    const newState = !this.allSelected;
    this.data.modules.forEach((m: any) => this.form.get(m.value)?.setValue(newState));
    this.allSelected = newState;
    this.updateToggleText();
  }

  private updateToggleText() {
    this.toggleText = this.allSelected ? 'Tout décocher' : 'Tout cocher';
  }
  onSubmit(): void {
    if (this.form.invalid) return;

    // Récupérer le rôle
    const role = this.form.get('role')?.value;

    // Parcourir les modules pour récupérer ceux qui sont cochés
    const selectedModules = this.data.modules
      .filter((module: any) => this.form.get(module.value)?.value)
      .map((module: any) => module.value);

    // Créer la libelle finale
    const libelle = selectedModules.join('-');

    this.dialogRef.close({ role, libelle });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
