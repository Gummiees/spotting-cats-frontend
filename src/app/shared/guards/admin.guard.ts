import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { AuthStateService } from "../services/auth-state.service";

@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  constructor(private authStateService: AuthStateService) {}

  async canActivate(): Promise<boolean> {
    // If we already have a user, check if they're admin immediately
    if (this.authStateService.user()) {
      return this.authStateService.user()?.isAdmin ?? false;
    }

    // Wait for the initial auth check to complete
    if (this.authStateService.initialAuthCheck) {
      await this.authStateService.initialAuthCheck;
    }

    return this.authStateService.user()?.isAdmin ?? false;
  }
}
