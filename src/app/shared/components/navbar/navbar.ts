import { Component, signal } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthStateService } from "@shared/services/auth-state.service";
import { AdminBadge } from "@shared/components/admin-badge/admin-badge";

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.html",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, AdminBadge],
})
export class Navbar {
  isMenuOpen = signal(false);
  userMenuOpen = signal(false);

  get user() {
    return this.authStateService.user();
  }

  constructor(private authStateService: AuthStateService) {}

  toggleMenu() {
    this.isMenuOpen.set(!this.isMenuOpen());
  }

  toggleUserMenu() {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  closeMenus() {
    this.isMenuOpen.set(false);
    this.userMenuOpen.set(false);
  }
}
