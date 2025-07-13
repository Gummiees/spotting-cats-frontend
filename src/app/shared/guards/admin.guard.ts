import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { AuthStateService } from "../services/auth-state.service";
import { isAdminOrSuperadmin } from "@shared/utils/role-permissions";

@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  constructor(private authStateService: AuthStateService) {}

  async canActivate(): Promise<boolean> {
    // If we already have a user, check if they're admin immediately
    const user = this.authStateService.user();
    if (user) {
      return isAdminOrSuperadmin(user.role);
    }

    // Wait for the initial auth check to complete
    if (this.authStateService.initialAuthCheck) {
      await this.authStateService.initialAuthCheck;
    }

    return isAdminOrSuperadmin(this.authStateService.user()?.role ?? "user");
  }
}
