import { Component } from "@angular/core";
import { AdminService } from "src/app/admin/services/admin.service";
import { AuthStateService } from "@shared/services/auth-state.service";
import {
  isAdminOrSuperadmin,
  isPrivilegedRole,
} from "@shared/utils/role-permissions";
import { AdminCacheService } from "../../services/admin-cache.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { StorageService } from "@shared/services/storage.service";

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
    private adminService: AdminService,
    private adminCacheService: AdminCacheService,
    private snackbarService: SnackbarService,
    private storageService: StorageService
  ) {}

  get userHasElevatedRole(): boolean {
    return !!this.user && isPrivilegedRole(this.user.role);
  }

  get userIsSuperadmin(): boolean {
    return this.user?.role === "superadmin";
  }

  get userIsAdminOrSuperadmin(): boolean {
    return !!this.user && isAdminOrSuperadmin(this.user.role);
  }

  async onPurgeCats() {
    if (!this.userIsAdminOrSuperadmin) {
      this.onForbiddenRequest();
      return;
    }

    await this.adminService.purgeCats();
  }

  async onFlushCache() {
    if (!this.userIsSuperadmin) {
      this.onForbiddenRequest();
      return;
    }

    await this.adminCacheService.flushCache();
  }

  async onUserCleanup() {
    if (!this.userIsAdminOrSuperadmin) {
      this.onForbiddenRequest();
      return;
    }

    await this.adminService.cleanup();
  }

  private onForbiddenRequest() {
    this.authStateService.setUnauthenticated();
    this.storageService.clear();
    this.snackbarService.show("You are not authorized to do that", "error");
  }
}
