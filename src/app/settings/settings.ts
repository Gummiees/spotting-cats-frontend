import { Component, effect, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import {
  InvalidCodeException,
  UserService,
} from "@shared/services/user.service";
import { Modal } from "@shared/components/modal/modal";
import { Header } from "@shared/components/header/header";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AdminBadge } from "@shared/components/admin-badge/admin-badge";
import moment from "moment";
import { LoadingButton } from "@shared/components/loading-button/loading-button";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.html",
  standalone: true,
  imports: [
    CommonModule,
    Modal,
    Header,
    AdminBadge,
    LoadingButton,
    ReactiveFormsModule,
    ModalContentSimple,
  ],
})
export class Settings {
  loadingUsername = signal(false);
  loadingEmail = signal(false);
  loadingAvatar = signal(false);
  loadingVerifyEmail = signal(false);
  isDeactivateModalOpen = signal(false);
  isAvatarModalOpen = signal(false);
  isVerifyEmailModalOpen = signal(false);

  avatarUrl = signal<string>("");
  availableAvatars = signal<{ id: number; url: string }[]>([]);
  form = new FormGroup({
    username: new FormControl("", [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]),
    email: new FormControl("", [Validators.required, Validators.email]),
  });
  verifyEmailInput = new FormControl("", [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(6),
  ]);

  get username() {
    return this.form.get("username");
  }
  get email() {
    return this.form.get("email");
  }

  get user() {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private userService: UserService,
    private router: Router,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService
  ) {
    effect(() => {
      this.form.patchValue({
        username: this.user?.username,
        email: this.user?.email,
      });
      this.avatarUrl.set(this.user?.avatarUrl ?? "");
      this.updateUsernameFieldState();
      this.updateEmailFieldState();
      this.updateAvatarFieldState();
    });

    this.generateAvailableAvatars();
  }

  private generateAvailableAvatars(): void {
    const avatars: string[] = [];
    const baseUrl = "https://api.dicebear.com/9.x/bottts/svg";

    // Generate 30 different avatars with various seeds
    for (let i = 0; i < 30; i++) {
      const seed = `avatar-${i}`;
      const avatarUrl = `${baseUrl}?seed=${seed}`;
      avatars.push(avatarUrl);
    }

    this.availableAvatars.set(
      avatars.map((url, index) => ({ id: index, url }))
    );
  }

  isUsernameValid(): boolean {
    return (
      !!this.username &&
      this.username.valid &&
      this.username.value !== this.user?.username
    );
  }

  isEmailValid(): boolean {
    return (
      !!this.email && this.email.valid && this.email.value !== this.user?.email
    );
  }

  isAvatarValid(): boolean {
    return this.avatarUrl() !== this.user?.avatarUrl;
  }

  async onSaveUsername() {
    const username = this.form.value.username;
    if (!username || username === this.user?.username) {
      return;
    }

    try {
      this.loadingUsername.set(true);
      await this.userService.updateUsername(username);
      this.snackbarService.show(
        "Username updated successfully",
        3000,
        "success"
      );
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to update username", 3000, "error");
    } finally {
      this.loadingUsername.set(false);
    }
  }

  async onSaveEmail() {
    const email = this.form.value.email;
    if (!email || email === this.user?.email) {
      return;
    }

    try {
      this.loadingEmail.set(true);
      await this.userService.updateEmail(email);
      this.onVerifyEmail();
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to update email", 3000, "error");
    } finally {
      this.loadingEmail.set(false);
    }
  }

  async onSaveAvatar() {
    const avatarUrl = this.avatarUrl();
    if (!avatarUrl || avatarUrl === this.user?.avatarUrl) {
      return;
    }

    try {
      this.loadingAvatar.set(true);
      await this.userService.updateAvatar(avatarUrl);
      this.snackbarService.show("Avatar updated successfully", 3000, "success");
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to update avatar", 3000, "error");
    } finally {
      this.loadingAvatar.set(false);
    }
  }

  onDeactivate() {
    this.isDeactivateModalOpen.set(true);
  }

  onCancelDeactivate() {
    this.isDeactivateModalOpen.set(false);
  }

  onVerifyEmail() {
    this.isVerifyEmailModalOpen.set(true);
  }

  onCancelVerifyEmail() {
    this.isVerifyEmailModalOpen.set(false);
  }

  onChangeAvatarModal() {
    this.isAvatarModalOpen.set(!this.isAvatarModalOpen());
  }

  onCloseAvatarModal() {
    this.isAvatarModalOpen.set(false);
  }

  onSelectAvatar(avatarUrl: string) {
    this.avatarUrl.set(avatarUrl);
    this.onCloseAvatarModal();
  }

  async onConfirmDeactivate() {
    try {
      this.loadingService.loading = true;
      await this.userService.deactivate();
      this.loadingService.loading = false;
      this.router.navigate(["/"]);
      this.snackbarService.show(
        "Account deactivated successfully",
        3000,
        "success"
      );
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to deactivate account", 3000, "error");
    } finally {
      this.loadingService.loading = false;
    }
  }

  async onConfirmVerifyEmail() {
    const code = this.verifyEmailInput.value;
    if (!code) {
      this.snackbarService.show("Please enter a code", 3000, "error");
      return;
    }

    try {
      this.loadingVerifyEmail.set(true);
      await this.userService.verifyEmail(code);
      this.isVerifyEmailModalOpen.set(false);
      this.snackbarService.show("Email verified successfully", 3000, "success");
    } catch (error) {
      if (error instanceof InvalidCodeException) {
        this.snackbarService.show(error.message, 3000, "error");
      } else {
        console.error(error);
        this.snackbarService.show("Failed to verify email", 3000, "error");
      }
    } finally {
      this.loadingVerifyEmail.set(false);
    }
  }

  canUpdateUsername(): boolean {
    if (!this.user?.usernameUpdatedAt) {
      return true;
    }

    return this.user.usernameUpdatedAt < this.thirtyDaysAgo();
  }

  canUpdateEmail(): boolean {
    if (!this.user?.emailUpdatedAt) {
      return true;
    }

    return this.user.emailUpdatedAt < this.ninetyDaysAgo();
  }

  canUpdateAvatar(): boolean {
    if (!this.user?.avatarUpdatedAt) {
      return true;
    }

    return this.user.avatarUpdatedAt < this.thirtyDaysAgo();
  }

  totalDaysSinceLastUsernameUpdate(): number {
    if (!this.user?.usernameUpdatedAt) {
      return 0;
    }

    return this.totalDaysSinceLastUpdate(this.user.usernameUpdatedAt);
  }

  totalDaysSinceLastEmailUpdate(): number {
    if (!this.user?.emailUpdatedAt) {
      return 0;
    }

    return this.totalDaysSinceLastUpdate(this.user.emailUpdatedAt);
  }

  totalDaysSinceLastAvatarUpdate(): number {
    if (!this.user?.avatarUpdatedAt) {
      return 0;
    }

    return this.totalDaysSinceLastUpdate(this.user.avatarUpdatedAt);
  }

  private totalDaysSinceLastUpdate(date: Date): number {
    return moment().diff(moment(date), "days");
  }

  private thirtyDaysAgo(): Date {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return thirtyDaysAgo;
  }

  private ninetyDaysAgo(): Date {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return ninetyDaysAgo;
  }

  private updateUsernameFieldState(): void {
    const usernameField = this.form.get("username");
    if (usernameField) {
      if (this.canUpdateUsername()) {
        usernameField.enable();
      } else {
        usernameField.disable();
      }
    }
  }

  private updateEmailFieldState(): void {
    const emailField = this.form.get("email");
    if (emailField) {
      if (this.canUpdateEmail()) {
        emailField.enable();
      } else {
        emailField.disable();
      }
    }
  }

  private updateAvatarFieldState(): void {
    const avatarField = this.form.get("avatar");
    if (avatarField) {
      if (this.canUpdateAvatar()) {
        avatarField.enable();
      } else {
        avatarField.disable();
      }
    }
  }
}
