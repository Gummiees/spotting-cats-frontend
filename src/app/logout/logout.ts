import { Component, signal } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UserService } from "@shared/services/user.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-logout",
  templateUrl: "./logout.html",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class Logout {
  loading = signal(false);

  constructor(private userService: UserService, private router: Router) {}

  public async onClick() {
    this.loading.set(true);
    try {
      await this.userService.logout();
      this.router.navigate(["/login"]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
