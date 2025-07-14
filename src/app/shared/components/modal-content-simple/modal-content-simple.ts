import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { ModalType } from "../modal/modal";

@Component({
  selector: "app-modal-content-simple",
  templateUrl: "./modal-content-simple.html",
  standalone: true,
  imports: [CommonModule],
})
export class ModalContentSimple {
  title = input.required<string>();
  message = input.required<string>();
  modalType = input<ModalType>("default");
  icon = input<string>("info");
  fullWidth = input<boolean>(false);

  getIconBackgroundColor(): string {
    return this.modalType() === "danger" ? "bg-red-100" : "bg-violet-100";
  }

  getIconColor(): string {
    return this.modalType() === "danger" ? "text-red-600" : "text-violet-500";
  }
}
