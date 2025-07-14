import { Component, computed, OnDestroy, OnInit, signal } from "@angular/core";
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
import {
  hasPermissionOverUser,
  isAdminOrSuperadmin,
} from "@shared/utils/role-permissions";
import { Subscription } from "rxjs";
import { UserService, NotFoundException } from "@shared/services/user.service";

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
export class Profile implements OnInit, OnDestroy {
  loadingBan = signal(false);
  loadingMakeAdmin = signal(false);
  loadingMakeModerator = signal(false);
  isBanModalOpen = signal(false);
  isMakeAdminModalOpen = signal(false);
  isMakeModeratorModalOpen = signal(false);
  banReasonInput = new FormControl("", [Validators.required]);
  user = signal<ExternalUser | null>(null);
  userNotFound = signal(false);
  private userSubscription!: Subscription;
  private username!: string;

  get loggedInUser() {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService,
    private adminService: AdminService,
    private userService: UserService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.username = this.route.snapshot.params["username"];
    this.userSubscription = this.route.data.subscribe({
      next: (data) => {
        const user = data["user"] as ExternalUser | null;
        this.user.set(user);
        this.userNotFound.set(user === null);
      },
      error: (_) => {
        this.userNotFound.set(true);
      },
    });
  }

  onOpenBanModal() {
    this.isBanModalOpen.set(true);
  }

  onOpenMakeAdminModal() {
    this.isMakeAdminModalOpen.set(true);
  }

  onOpenMakeModeratorModal() {
    this.isMakeModeratorModalOpen.set(true);
  }

  async onConfirmBanOrUnban() {
    if (this.user()?.isBanned) {
      await this.onConfirmUnban();
    } else {
      await this.onConfirmBan();
    }
  }

  onCancelModal() {
    this.isBanModalOpen.set(false);
    this.isMakeAdminModalOpen.set(false);
    this.isMakeModeratorModalOpen.set(false);
  }

  hasPermissionOverUser(): boolean {
    const user = this.user();
    if (!this.loggedInUser || !user) {
      return false;
    }
    return hasPermissionOverUser({
      loggedInUserRole: this.loggedInUser.role,
      userRole: user.role,
    });
  }

  isLoggedInUserAdminOrSuperadmin(): boolean {
    if (!this.loggedInUser) {
      return false;
    }

    return isAdminOrSuperadmin(this.loggedInUser.role);
  }

  private async onConfirmBan() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      return;
    }

    try {
      this.loadingBan.set(true);
      await this.adminService.banUser(
        user.username,
        this.banReasonInput.value,
        user.role
      );
      this.isBanModalOpen.set(false);
      this.snackbarService.show("Account banned successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to ban account", "error");
    } finally {
      this.loadingBan.set(false);
    }
  }

  private async onConfirmUnban() {
    const user = this.user();
    if (!user) {
      return;
    }

    this.loadingBan.set(true);
    try {
      await this.adminService.unbanUser(user.username, user.role);
      this.onCancelModal();
      this.snackbarService.show(
        "Account unbanned successfully",
        "success",
        3000
      );
      this.getUserProfile();
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to unban account", "error");
    } finally {
      this.loadingBan.set(false);
    }
  }

  async onConfirmMakeOrRemoveAdmin() {
    if (this.user()?.role === "user") {
      await this.onConfirmMakeAdmin();
    } else {
      await this.onConfirmDemoteToUser();
    }
  }

  private async onConfirmMakeAdmin() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      return;
    }

    try {
      this.loadingMakeAdmin.set(true);
      await this.adminService.updateRole(user.username, "admin");
      this.onCancelModal();
      this.snackbarService.show("Admin made successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to make admin", "error");
    } finally {
      this.loadingMakeAdmin.set(false);
    }
  }

  private async onConfirmDemoteToUser() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      return;
    }

    try {
      this.loadingMakeAdmin.set(true);
      this.loadingMakeModerator.set(true);
      await this.adminService.demoteToUser(user.username);
      this.onCancelModal();
      this.snackbarService.show(
        "User demoted to user successfully",
        "success",
        3000
      );
      this.getUserProfile();
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to demote user", "error");
    } finally {
      this.loadingMakeAdmin.set(false);
      this.loadingMakeModerator.set(false);
    }
  }

  async onConfirmMakeOrRemoveModerator() {
    if (this.user()?.role === "user") {
      await this.onConfirmMakeModerator();
    } else {
      await this.onConfirmDemoteToUser();
    }
  }

  private async onConfirmMakeModerator() {
    const user = this.user();
    if (!user || !this.hasPermissionOverUser()) {
      return;
    }

    try {
      this.loadingMakeModerator.set(true);
      await this.adminService.updateRole(user.username, "moderator");
      this.onCancelModal();
      this.snackbarService.show("Moderator made successfully", "success", 3000);
      this.getUserProfile();
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to make moderator", "error");
    } finally {
      this.loadingMakeModerator.set(false);
    }
  }

  private async getUserProfile() {
    try {
      this.loadingService.setLoading(true);
      const externalUser = await this.userService.getUserByUsername(
        this.username
      );
      this.user.set(externalUser);
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to get user profile", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  // UI stuff

  get shouldDisplayModeratorButton() {
    const user = this.user();
    return (
      !!user &&
      !isAdminOrSuperadmin(user.role) &&
      this.isLoggedInUserAdminOrSuperadmin()
    );
  }

  get shouldDisplayAdminButton() {
    const user = this.user();
    return (
      user?.role !== "superadmin" && this.loggedInUser?.role === "superadmin"
    );
  }

  get banButtonText() {
    return this.user()?.isBanned ? "Unban user" : "Ban user";
  }

  get banModalMessage() {
    return this.user()?.isBanned
      ? "Are you sure you want to unban this user?"
      : "Please enter the reason for banning the user.";
  }

  get adminButtonText() {
    return this.user()?.role === "user" ? "Make admin" : "Remove admin";
  }

  get adminModalMessage() {
    return this.user()?.role === "user"
      ? "Are you sure you want to make this user an admin?"
      : "Are you sure you want to remove this user as an admin?";
  }

  get adminIcon() {
    return this.user()?.role === "user" ? "shield_person" : "remove_moderator";
  }

  get moderatorButtonText() {
    return this.user()?.role === "user" ? "Make moderator" : "Remove moderator";
  }

  get moderatorModalMessage() {
    return this.user()?.role === "user"
      ? "Are you sure you want to make this user a moderator?"
      : "Are you sure you want to remove this user as a moderator?";
  }

  get moderatorIcon() {
    return this.user()?.role === "user" ? "add_moderator" : "remove_moderator";
  }

  hasBadge(): boolean {
    const user = this.user();
    return (
      !!user &&
      (user.role === "superadmin" ||
        user.role === "admin" ||
        user.role === "moderator" ||
        user.isBanned ||
        user.isInactive)
    );
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
}
