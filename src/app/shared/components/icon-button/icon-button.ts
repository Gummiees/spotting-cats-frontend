import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";

@Component({
  selector: "app-icon-button",
  templateUrl: "./icon-button.html",
  standalone: true,
  imports: [CommonModule],
})
export class IconButton {
  icon = input.required<string>();
  ariaLabel = input<string>("");
  isDisabled = input<boolean>(false);
  onClick = output<void>();

  onButtonClick() {
    this.onClick.emit();
  }
}
