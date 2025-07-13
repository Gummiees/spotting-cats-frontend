import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { LoadingButton } from "../loading-button/loading-button";

export type ModalType = "default" | "warning";

@Component({
  selector: "app-modal",
  templateUrl: "./modal.html",
  standalone: true,
  imports: [CommonModule, LoadingButton],
})
export class Modal {
  isOpen = input.required<boolean>();
  isLoading = input<boolean>(false);
  confirmText = input.required<string>();
  confirmColor = input<ModalType>("default");
  cancelText = input.required<string>();
  onConfirm = output<void>();
  onCancel = output<void>();

  onConfirmClick() {
    this.onConfirm.emit();
  }

  onCancelClick() {
    this.onCancel.emit();
  }

  getConfirmButtonClass(): string {
    return this.confirmColor() === "warning"
      ? " bg-red-600 enabled:hover:bg-red-700 enabled:outline-red-700 enabled:focus-visible:outline-red-700 enabled:active:bg-red-800"
      : " bg-violet-500 enabled:hover:bg-violet-600 enabled:outline-violet-600 enabled:focus-visible:outline-violet-600 enabled:active:bg-violet-700";
  }
}
