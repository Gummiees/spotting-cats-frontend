import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminService } from "./admin.service";
import { AuthStateService } from "@shared/services/auth-state.service";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.html",
  standalone: true,
  imports: [CommonModule],
  providers: [AdminService],
})
export class Admin {
  get user() {
    return this.authStateService.user();
  }

  async onMigrateAvatars() {
    await this.adminService.migrateAvatars();
  }

  constructor(
    private authStateService: AuthStateService,
    private adminService: AdminService
  ) {}
}
