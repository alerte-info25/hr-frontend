import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../../material.module';
@Component({
  selector: 'app-forms-dialog',
  standalone: true,
  templateUrl: './forms-dialog.component.html',
  styleUrl: './forms-dialog.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
  ]
})
export class FormsDialogComponent implements OnInit {
  form!: FormGroup;
  idValue!: number;
  isEditMode = false;
  selectedFile: File | null = null;
  selectedFilePdf: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  selectedDocuments: File[] = [];
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<FormsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }
  ngOnInit(): void {
    this.isEditMode = !!this.data?.item;
    this.initForm();
    if (this.isEditMode) {
      this.idValue = this.data.id;
      this.patchForm();
    }
  }
  initForm(){
    const group: { [key: string]: any } = {};
    this.data.fields.forEach((field: any) => {
      let validators = [];
      if (field.validators?.includes('required')) {
        validators.push(Validators.required);
      }
      if (field.validators?.includes('email')) {
        validators.push(Validators.email);
      }


      let defaultValue: any = '';
      if (field.type === 'checkbox') {
        defaultValue = false; // coche par défaut à false
      } else if (this.isEditMode && this.data.item?.[field.name] !== undefined) {
        defaultValue = this.data.item[field.name];
      }
      // group[field.name] = new FormControl('', validators);
    group[field.name] = new FormControl(defaultValue, validators);
    });
    this.form = this.fb.group(group);
  }
  patchForm(){
    const patched = { ...this.data.item };
    this.data.fields.forEach((field: any) => {
    if (field.type === 'datetime-local' && patched[field.name]) {
      // convertit "2025-10-14 08:30:00" → "2025-10-14T08:30"
      patched[field.name] = patched[field.name].replace(' ', 'T').slice(0, 16);
    }
  });
    this.form.patchValue(patched)
  }
  onSubmit(): void {
    if (this.form.invalid) return;
    const formData = new FormData();
    this.data.fields.forEach((field: any) => {
      if (field.type === 'file') {
        if (this.selectedFile) {
          formData.append(field.name, this.selectedFile);
        }
      } else if (field.type === 'file2') {
        if (this.selectedFilePdf) {
          formData.append(field.name, this.selectedFilePdf, this.selectedFilePdf.name);
        }
      }else if (field.type === 'file3') {
        if (this.selectedDocuments.length > 0) {
          this.selectedDocuments.forEach(file => {
            formData.append(field.name + '[]', file); // IMPORTANT → documents[]
          });
        }
      }else if (field.type === 'checkbox') {
        formData.append(field.name, this.form.get(field.name)?.value ? '1' : '0');
      } else if (field.type === 'datetime-local') {
        const value = this.form.get(field.name)?.value;
        if (value) {
          const formatted = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
          formData.append(field.name, formatted);
        }
      } else {
        formData.append(field.name, this.form.get(field.name)?.value);
      }
    });
    this.dialogRef.close(formData); // envoie un FormData au parent

  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
  onMultiplePdfSelected(event: any) {
    const files = event.target.files;

    if (files && files.length > 0) {
      this.selectedDocuments = Array.from(files); // Convertit FileList -> Array<File>
    }
  }

    onFileSelected(event: any): void {
      const file = event.target.files[0] as File;
      if (file) {
        const reader = new FileReader();

        // Écouter l'événement de lecture
        reader.onload = (event: any) => {
          this.selectedFile = event.target.result; // Enregistrer la chaîne Base64
        };

        // Lancer la lecture du fichier
        reader.readAsDataURL(file);
      }else{
        this.selectedFile = null
      }

    }
    onFilePdfSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFilePdf = file;
    } else {
      this.selectedFilePdf = null;
      alert('Veuillez sélectionner un fichier PDF valide.');
    }
  }

    isFieldVisible(field: any): boolean {
      if (!field.visibleIf) return true;

      const relatedField = this.form.get(field.visibleIf.field);
      return relatedField?.value === field.visibleIf.value;
    }
    setupAutoCalculations() {
    this.data.fields.forEach((field: any) => {
      if (field.autoCalculate) {
        const { dependsOn } = field.autoCalculate;

        dependsOn.forEach((dep: string) => {
          this.form.get(dep)?.valueChanges.subscribe(() => {
            this.recalculateField(field);
          });
        });
      }
    });
  }

  recalculateField(field: any) {
    const { source, unit } = field.autoCalculate;

    // exemple : source = 'id_type.duree'
    const [selectField, prop] = source.split('.');

    const selectedValue = this.form.get(selectField)?.value;
    const selectedOption = this.data.fields.find((f: any) => f.name === selectField)?.options
      ?.find((opt: any) => opt.value === selectedValue);

    const duree = selectedOption?.[prop];
    const dateDebut = this.form.get('dateDebut')?.value;

    if (duree && dateDebut) {
      const debut = new Date(dateDebut);
      const fin = new Date(debut);

      if (unit === 'month') {
        fin.setMonth(fin.getMonth() + duree);
      } else if (unit === 'day') {
        fin.setDate(fin.getDate() + duree);
      }

      this.form.get(field.name)?.setValue(fin.toISOString().split('T')[0], { emitEvent: false });
    }
  }

}
