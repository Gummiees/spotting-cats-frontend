import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
  selector: "app-header",
  templateUrl: "./header.html",
  standalone: true,
  imports: [CommonModule],
})
export class Header {
  title = input.required<string>();
}
