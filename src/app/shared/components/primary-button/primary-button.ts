import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingButton } from "../loading-button/loading-button";

export type PrimaryButtonType =
  | "default"
  | "warning"
  | "success"
  | "info"
  | "danger";

@Component({
  selector: "app-primary-button",
  templateUrl: "./primary-button.html",
  standalone: true,
  imports: [CommonModule, LoadingButton],
})
export class PrimaryButton {
  isDisabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  buttonText = input.required<string>();
  onClick = output<void>();
  buttonType = input<PrimaryButtonType>("default");

  onButtonClick() {
    this.onClick.emit();
  }

  getColorButtonClass(): string {
    switch (this.buttonType()) {
      case "danger":
        return "bg-red-600 enabled:hover:bg-red-700 enabled:outline-red-700 enabled:focus-visible:outline-red-700 enabled:active:bg-red-800";
      case "success":
        return "bg-green-500 enabled:hover:bg-green-600 enabled:outline-green-600 enabled:focus-visible:outline-green-600 enabled:active:bg-green-700";
      case "info":
        return "bg-blue-500 enabled:hover:bg-blue-600 enabled:outline-blue-600 enabled:focus-visible:outline-blue-600 enabled:active:bg-blue-700";
      case "warning":
        return "bg-amber-500 enabled:hover:bg-amber-600 enabled:outline-amber-600 enabled:focus-visible:outline-amber-600 enabled:active:bg-amber-700";
      default:
        return "bg-violet-500 enabled:hover:bg-violet-600 enabled:outline-violet-600 enabled:focus-visible:outline-violet-600 enabled:active:bg-violet-700";
    }
  }
}
