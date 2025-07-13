import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Modal } from "@shared/components/modal/modal";
import { Header } from "@shared/components/header/header";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { Badge } from "@shared/components/badge/badge";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";
import { AdminService } from "@shared/services/admin.service";
import { ExternalUser } from "@models/external-user";
import { NotFound } from "../not-found/not-found";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import { hasPermissionToBan } from "@shared/utils/role-permissions";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.html",
  standalone: true,
  imports: [
    CommonModule,
    Modal,
    Header,
    Badge,
    ReactiveFormsModule,
    ModalContentSimple,
    NotFound,
    PrimaryButton,
  ],
})
export class Profile implements OnInit {
  loading = signal(false);
  isModalOpen = signal(false);
  banReasonInput = new FormControl("", [Validators.required]);
  user = signal<ExternalUser | null>(null);

  get loggedInUser() {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.user.set(data["user"] as ExternalUser);
    });
  }

  get buttonText() {
    return this.user()?.isBanned ? "Unban user" : "Ban user";
  }

  get modalTitle() {
    return this.user()?.isBanned ? "Unban user" : "Ban user";
  }

  get modalMessage() {
    return this.user()?.isBanned
      ? "Are you sure you want to unban this user?"
      : "Please enter the reason for banning the user.";
  }

  onOpenModal() {
    this.isModalOpen.set(true);
  }

  async onConfirm() {
    if (this.user()?.isBanned) {
      await this.onConfirmUnban();
    } else {
      await this.onConfirmBan();
    }
  }

  onCancel() {
    this.isModalOpen.set(false);
  }

  hasPermissionToBan(): boolean {
    const user = this.user();
    if (!this.loggedInUser || !user) {
      return false;
    }
    return hasPermissionToBan(this.loggedInUser.role, user.role);
  }

  async onConfirmBan() {
    const user = this.user();
    if (!user) {
      return;
    }

    try {
      this.loadingService.loading = true;
      await this.adminService.banUser(
        user.username,
        this.banReasonInput.value,
        user.role
      );
      this.loadingService.loading = false;
      this.snackbarService.show("Account banned successfully", "success", 3000);
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to ban account", "error");
    } finally {
      this.loadingService.loading = false;
    }
  }

  async onConfirmUnban() {
    const user = this.user();
    if (!user) {
      return;
    }

    try {
      this.loadingService.loading = true;
      await this.adminService.unbanUser(user.username, user.role);
      this.loadingService.loading = false;
      this.snackbarService.show(
        "Account unbanned successfully",
        "success",
        3000
      );
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to unban account", "error");
    } finally {
      this.loadingService.loading = false;
    }
  }
}
