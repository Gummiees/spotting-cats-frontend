import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-modal",
  templateUrl: "./modal.html",
  standalone: true,
  imports: [CommonModule],
})
export class Modal {
  isOpen = input.required<boolean>();
  title = input.required<string>();
  message = input.required<string>();
  confirmText = input.required<string>();
  cancelText = input.required<string>();
  onConfirm = output<void>();
  onCancel = output<void>();

  onConfirmClick() {
    this.onConfirm.emit();
  }

  onCancelClick() {
    this.onCancel.emit();
  }
}
