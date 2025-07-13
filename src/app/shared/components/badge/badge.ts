import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";

export type BadgeType = "superadmin" | "admin" | "banned" | "moderator";

@Component({
  selector: "app-badge",
  templateUrl: "./badge.html",
  standalone: true,
  imports: [CommonModule],
})
export class Badge {
  type = input.required<BadgeType>();
}
