import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [],
  templateUrl: './confirm-delete-dialog.component.html',
  styleUrl: './confirm-delete-dialog.component.scss'
})
export class ConfirmDeleteDialogComponent {
  @Input() title: string = 'Confirmation';
  @Input() message: string = 'Voulez-vous vraiment continuer ?';
  @Input() confirmText: string = 'Oui';
  @Input() cancelText: string = 'Non';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
