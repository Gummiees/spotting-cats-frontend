import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingButton } from "../loading-button/loading-button";

export type PrimaryButtonType = "default" | "warning";

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
    return this.buttonType() === "warning"
      ? "bg-red-600 enabled:hover:bg-red-700 enabled:outline-red-700 enabled:focus-visible:outline-red-700 enabled:active:bg-red-800"
      : "bg-violet-500 enabled:hover:bg-violet-600 enabled:outline-violet-600 enabled:focus-visible:outline-violet-600 enabled:active:bg-violet-700";
  }
}
