import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";

@Injectable({
  providedIn: "root",
})
export class AnonymousGuard implements CanActivate {
  constructor(private authStateService: AuthStateService) {}

  async canActivate(): Promise<boolean> {
    // If we already have a user, deny access immediately
    if (this.authStateService.user()) {
      return false;
    }

    // Wait for the initial auth check to complete
    if (this.authStateService.initialAuthCheck) {
      await this.authStateService.initialAuthCheck;
    }

    return !this.authStateService.user();
  }
}
