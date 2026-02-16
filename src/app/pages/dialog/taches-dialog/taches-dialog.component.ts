import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from '../../../../../material.module';

@Component({
  selector: 'app-taches-dialog',
  imports: [MaterialModule, FormsModule,ReactiveFormsModule],
  templateUrl: './taches-dialog.component.html',
  styleUrl: './taches-dialog.component.scss'
})
export class TachesDialogComponent {
  taskForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TachesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskForm = this.fb.group({
      title: [data.task?.title || '', Validators.required],
      description: [data.task?.description || ''],
      deadline: [data.task?.deadline || ''],
      status: [data.task?.status || 'en_attente'],
      progress: [data.task?.progress || 0],
      visibility: [data.task?.visibility || 'private'],
    });
  }

  onSubmit() {
    if (this.taskForm.valid) {
      this.dialogRef.close(this.taskForm.value);
    }
  }
}
