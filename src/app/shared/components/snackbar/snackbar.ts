import { CommonModule } from "@angular/common";
import { Component, signal } from "@angular/core";

export type SnackbarType = "success" | "error" | "warning" | "info";

@Component({
  selector: "app-snackbar",
  templateUrl: "./snackbar.html",
  standalone: true,
  imports: [CommonModule],
})
export class Snackbar {
  visible = signal(false);
  message = signal("");
  type = signal<SnackbarType>("success");

  show(message: string, type: SnackbarType = "success", duration = 3000) {
    this.message.set(message);
    this.visible.set(true);
    this.type.set(type);

    if (type !== "error") {
      setTimeout(() => this.visible.set(false), duration);
    }
  }

  hide() {
    this.visible.set(false);
  }
}
