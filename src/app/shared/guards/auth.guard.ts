import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(private authStateService: AuthStateService) {}

  canActivate(): boolean {
    return !!this.authStateService.user();
  }
}
