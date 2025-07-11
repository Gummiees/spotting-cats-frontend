import { Component, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthStateService } from "@shared/services/auth-state.service";
import { AdminBadge } from "@shared/components/admin-badge/admin-badge";
import { UserService } from "@shared/services/user.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";

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

  constructor(
    private authStateService: AuthStateService,
    private userService: UserService,
    private router: Router,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService
  ) {}

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

  async onLogout() {
    this.loadingService.loading = true;
    try {
      await this.userService.logout();
      this.loadingService.loading = false;
      this.router.navigate(["/login"]);
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to sign out", 3000, "error");
    } finally {
      this.loadingService.loading = false;
    }
  }
}
