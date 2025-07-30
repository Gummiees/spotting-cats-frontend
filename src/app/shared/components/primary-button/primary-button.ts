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
  buttonText = input<string>("");
  onClick = output<void>();
  buttonType = input<PrimaryButtonType>("default");
  buttonSize = input<"auto" | "full">("auto");

  onButtonClick() {
    this.onClick.emit();
  }

  getButtonClass(): string[] {
    const classList = [];
    switch (this.buttonType()) {
      case "danger":
        classList.push(
          "bg-red-600",
          "enabled:hover:bg-red-700",
          "enabled:outline-red-700",
          "enabled:focus-visible:outline-red-700",
          "enabled:active:bg-red-800"
        );
        break;
      case "success":
        classList.push(
          "bg-green-500",
          "enabled:hover:bg-green-600",
          "enabled:outline-green-600",
          "enabled:focus-visible:outline-green-600",
          "enabled:active:bg-green-700"
        );
        break;
      case "info":
        classList.push(
          "bg-blue-500",
          "enabled:hover:bg-blue-600",
          "enabled:outline-blue-600",
          "enabled:focus-visible:outline-blue-600",
          "enabled:active:bg-blue-700"
        );
        break;
      case "warning":
        classList.push(
          "bg-amber-500",
          "enabled:hover:bg-amber-600",
          "enabled:outline-amber-600",
          "enabled:focus-visible:outline-amber-600",
          "enabled:active:bg-amber-700"
        );
        break;
      default:
        classList.push(
          "bg-violet-500",
          "enabled:hover:bg-violet-600",
          "enabled:outline-violet-600",
          "enabled:focus-visible:outline-violet-600",
          "enabled:active:bg-violet-700"
        );
        break;
    }
    if (this.buttonSize() === "full") {
      classList.push("w-full");
    }
    return classList;
  }
}
