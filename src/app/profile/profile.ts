import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { UserService } from "@shared/services/user.service";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.html",
  standalone: true,
  imports: [CommonModule],
})
export class Profile {
  loading = signal(false);
  get user() {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private userService: UserService,
    private router: Router
  ) {}

  async onDelete() {
    try {
      this.loading.set(true);
      await this.userService.delete();
      this.router.navigate(["/"]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
