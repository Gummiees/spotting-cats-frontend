import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { SecondaryButton } from "../secondary-button/secondary-button";
import {
  PrimaryButton,
  PrimaryButtonType,
} from "../primary-button/primary-button";

export type ModalType = "default" | "danger";

@Component({
  selector: "app-modal",
  templateUrl: "./modal.html",
  standalone: true,
  imports: [CommonModule, SecondaryButton, PrimaryButton],
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
    return this.confirmColor() === "danger"
      ? " bg-red-600 enabled:hover:bg-red-700 enabled:outline-red-700 enabled:focus-visible:outline-red-700 enabled:active:bg-red-800"
      : " bg-violet-500 enabled:hover:bg-violet-600 enabled:outline-violet-600 enabled:focus-visible:outline-violet-600 enabled:active:bg-violet-700";
  }

  getButtonType(): PrimaryButtonType {
    return this.confirmColor() === "danger" ? "danger" : "default";
  }
}
