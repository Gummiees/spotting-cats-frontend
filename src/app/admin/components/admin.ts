import { Component } from "@angular/core";
import { AdminService } from "src/app/admin/services/admin.service";
import { AuthStateService } from "@shared/services/auth-state.service";
import { isPrivilegedRole } from "@shared/utils/role-permissions";

@Component({
  selector: "app-admin",
  templateUrl: "./admin.html",
  standalone: false,
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

  get userHasElevatedRole(): boolean {
    return !!this.user && isPrivilegedRole(this.user.role);
  }
}
