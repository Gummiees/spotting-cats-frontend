import { Component, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-loading-button",
  templateUrl: "./loading-button.html",
  standalone: true,
  imports: [CommonModule],
})
export class LoadingButton {
  loading = input.required<boolean>();
  buttonText = input.required<string>();
  isPrimaryButton = input<boolean>(true);
}
