import { Component, effect, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { UserService } from "@shared/services/user.service";
import { Modal } from "@shared/components/modal/modal";
import { Header } from "@shared/components/header/header";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AdminBadge } from "@shared/components/admin-badge/admin-badge";
import moment from "moment";
import { Spinner } from "@shared/components/spinner/spinner";
import { LoadingButton } from "@shared/components/loading-button/loading-button";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.html",
  standalone: true,
  imports: [
    CommonModule,
    Modal,
    Header,
    AdminBadge,
    Spinner,
    LoadingButton,
    ReactiveFormsModule,
  ],
})
export class Settings {
  loadingUsername = signal(false);
  loadingEmail = signal(false);
  loadingAvatar = signal(false);
  loadingDelete = signal(false);
  isDeleteModalOpen = signal(false);
  isAvatarModalOpen = signal(false);

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
    private router: Router
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
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingAvatar.set(false);
    }
  }

  onDelete() {
    this.isDeleteModalOpen.set(true);
  }

  onCancelDelete() {
    this.isDeleteModalOpen.set(false);
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

  async onConfirmDelete() {
    try {
      this.loadingDelete.set(true);
      await this.userService.delete();
      this.router.navigate(["/"]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingDelete.set(false);
    }
  }

  canUpdateUsername(): boolean {
    if (!this.user?.usernameUpdatedAt) {
      return true;
    }

    return this.user.usernameUpdatedAt < this.thirtyDaysAgo();
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
