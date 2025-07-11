import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Header } from "@shared/components/header/header";
import { AdminBadge } from "@shared/components/admin-badge/admin-badge";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.html",
  standalone: true,
  imports: [CommonModule, Header, AdminBadge],
})
export class Profile {
  get user() {
    return this.authStateService.user();
  }

  constructor(private authStateService: AuthStateService) {}
}
