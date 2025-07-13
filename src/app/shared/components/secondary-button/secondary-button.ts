import { Component, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { LoadingButton } from "../loading-button/loading-button";

@Component({
  selector: "app-secondary-button",
  templateUrl: "./secondary-button.html",
  standalone: true,
  imports: [CommonModule, LoadingButton],
})
export class SecondaryButton {
  isDisabled = input<boolean>(false);
  isLoading = input<boolean>(false);
  buttonText = input.required<string>();
  onClick = output<void>();

  onButtonClick() {
    this.onClick.emit();
  }
}
