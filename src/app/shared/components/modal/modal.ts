import { CommonModule } from "@angular/common";
import { Component, input, output, effect, OnDestroy } from "@angular/core";
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
export class Modal implements OnDestroy {
  isOpen = input.required<boolean>();
  isLoading = input<boolean>(false);
  confirmText = input.required<string>();
  confirmColor = input<ModalType>("default");
  cancelText = input.required<string>();
  isDisabled = input<boolean>(false);
  onConfirm = output<void>();
  onCancel = output<void>();
  displayButtons = input<boolean>(true);

  constructor() {
    // Effect to handle scroll disabling when modal opens/closes
    effect(() => {
      if (this.isOpen()) {
        this.disableScroll();
      } else {
        this.enableScroll();
      }
    });
  }

  ngOnDestroy() {
    // Ensure scroll is re-enabled when component is destroyed
    this.enableScroll();
  }

  private disableScroll(): void {
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = this.getScrollbarWidth() + "px";
  }

  private enableScroll(): void {
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }

  private getScrollbarWidth(): number {
    // Calculate scrollbar width to prevent layout shift
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    document.body.appendChild(outer);

    const inner = document.createElement("div");
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  }

  onConfirmClick() {
    if (this.isDisabled()) {
      return;
    }

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
