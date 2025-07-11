import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { AuthStateService } from "../services/auth-state.service";

@Injectable({
  providedIn: "root",
})
export class AdminGuard implements CanActivate {
  constructor(private authStateService: AuthStateService) {}

  canActivate(): boolean {
    return this.authStateService.user()?.isAdmin ?? false;
  }
}
