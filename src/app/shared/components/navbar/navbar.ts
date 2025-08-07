import { Component, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Badge } from "@shared/components/badge/badge";
import { UserService } from "@shared/services/user.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";
import { LoginModalService } from "@shared/services/login-modal.service";
import { PrimaryButton } from "../primary-button/primary-button";
import { isAdminOrSuperadmin } from "@shared/utils/role-permissions";

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.html",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, Badge, PrimaryButton],
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
    private loadingService: LoadingService,
    private loginModalService: LoginModalService
  ) {}

  isAdminOrSuperadmin() {
    if (!this.user) {
      return false;
    }
    return isAdminOrSuperadmin(this.user.role);
  }

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
    if (!this.userMenuOpen()) {
      return;
    }

    this.loadingService.setLoading(true);
    try {
      await this.userService.logout();
      this.loadingService.setLoading(false);
      this.router.navigate(["/"]);
    } catch (error) {
      this.snackbarService.show("Failed to sign out", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  onLoginClick() {
    this.loginModalService.openModal();
  }

  async onAddCatClick() {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }
    this.closeMenus();
    this.router.navigate(["/cat/add"]);
  }
}
