import { Component, effect, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import {
  EmailAlreadyTakenException,
  EmailSameAsCurrentException,
  InvalidCodeException,
  InvalidEmailException,
  RateLimitException,
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
import { Badge } from "@shared/components/badge/badge";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import { SecondaryButton } from "@shared/components/secondary-button/secondary-button";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  Subject,
  takeUntil,
  tap,
  of,
  from,
  catchError,
} from "rxjs";
import { stricterEmailValidator } from "@shared/validators/stricter-email.validator";
import { DaysAgoPipe } from "@shared/pipes/days-ago.pipe";

@Component({
  selector: "app-settings",
  templateUrl: "./settings.html",
  standalone: true,
  imports: [
    CommonModule,
    Modal,
    Header,
    Badge,
    ReactiveFormsModule,
    ModalContentSimple,
    PrimaryButton,
    SecondaryButton,
    DaysAgoPipe,
  ],
})
export class Settings implements OnDestroy {
  loadingUsername = signal(false);
  loadingEmail = signal(false);
  loadingAvatar = signal(false);
  loadingVerifyEmail = signal(false);
  isDeactivateModalOpen = signal(false);
  isAvatarModalOpen = signal(false);
  isVerifyEmailModalOpen = signal(false);
  isUsernameAvailable = signal<boolean | null>(null);
  isEmailAvailable = signal<boolean | null>(null);
  emailError = signal<string | null>(null);
  subUntilDestroyed$ = new Subject<void>();
  private isCheckingUsername = signal(false);
  private isCheckingEmail = signal(false);

  avatarUrl = signal<string>("");
  availableAvatars = signal<{ id: number; url: string }[]>([]);
  form = new FormGroup({
    username: new FormControl("", [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]),
    email: new FormControl("", [Validators.required, stricterEmailValidator()]),
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
    this.checkUsernameAvailabilityEffect();
    this.checkEmailAvailabilityEffect();

    effect(() => {
      this.form.patchValue(
        {
          username: this.user?.username,
        },
        { emitEvent: false }
      );
      this.avatarUrl.set(this.user?.avatarUrl ?? "");
      this.updateUsernameFieldState();
      this.updateEmailFieldState();
      this.updateAvatarFieldState();
    });

    this.generateAvailableAvatars();
  }

  private checkUsernameAvailabilityEffect(): void {
    this.form
      .get("username")
      ?.valueChanges.pipe(
        tap(() => {
          this.isCheckingUsername.set(true);
          this.isUsernameAvailable.set(null);
        }),
        filter(
          (username) => !!username && this.isNewUsernameDifferent(username)
        ),
        distinctUntilChanged(),
        debounceTime(500),
        takeUntil(this.subUntilDestroyed$),
        switchMap((username) =>
          from(this.checkUsernameAvailability(username!)).pipe(
            catchError(() => of(false))
          )
        )
      )
      .subscribe((isAvailable) => {
        this.isUsernameAvailable.set(isAvailable);
        this.isCheckingUsername.set(false);
      });
  }

  private checkEmailAvailabilityEffect(): void {
    this.form
      .get("email")
      ?.valueChanges.pipe(
        tap(() => {
          this.emailError.set(null);
          this.isCheckingEmail.set(true);
          this.isEmailAvailable.set(null);
        }),
        filter((email) => !!email && this.form.get("email")!.valid),
        distinctUntilChanged(),
        debounceTime(500),
        takeUntil(this.subUntilDestroyed$),
        switchMap((email) =>
          from(this.checkEmailAvailability(email!)).pipe(
            catchError(() => of(false))
          )
        )
      )
      .subscribe((isAvailable) => {
        this.isEmailAvailable.set(isAvailable);
        this.isCheckingEmail.set(false);
      });
  }

  private async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      return await this.userService.checkUsernameAvailability(username);
    } catch (error) {
      return false;
    }
  }

  private async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      return await this.userService.checkEmailAvailability(email);
    } catch (error) {
      if (
        error instanceof EmailAlreadyTakenException ||
        error instanceof InvalidEmailException ||
        error instanceof EmailSameAsCurrentException
      ) {
        this.emailError.set(error.message);
      } else {
        this.emailError.set("Failed to check email availability");
      }
      return false;
    }
  }

  private generateAvailableAvatars(): void {
    const avatars: string[] = [];
    const baseUrl = "https://api.dicebear.com/9.x/bottts/svg";

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
      !!this.username.value &&
      this.username.valid &&
      this.isNewUsernameDifferent(this.username.value) &&
      this.isUsernameAvailable() === true &&
      !this.isCheckingUsername()
    );
  }

  isEmailValid(): boolean {
    return (
      !!this.email &&
      this.email.valid &&
      this.isEmailAvailable() === true &&
      !this.isCheckingEmail()
    );
  }

  isAvatarValid(): boolean {
    return this.avatarUrl() !== this.user?.avatarUrl;
  }

  async onSaveUsername() {
    const username = this.form.value.username;
    if (!this.canUpdateUsername() || !username || !this.isUsernameValid()) {
      this.snackbarService.show("You can't update your username", "error");
      return;
    }

    try {
      this.loadingUsername.set(true);
      await this.userService.updateUsername(username);
      this.snackbarService.show(
        "Username updated successfully",
        "success",
        3000
      );
    } catch (error) {
      this.snackbarService.show("Failed to update username", "error");
    } finally {
      this.loadingUsername.set(false);
    }
  }

  private isNewUsernameDifferent(username: string): boolean {
    return username !== this.user?.username;
  }

  async onSaveEmail() {
    const email = this.form.value.email;
    if (!this.canUpdateEmail() || !email || !this.isEmailValid()) {
      this.snackbarService.show("You can't update your email", "error");
      return;
    }

    try {
      this.loadingEmail.set(true);
      await this.userService.updateEmail(email);
      this.isVerifyEmailModalOpen.set(true);
    } catch (error) {
      if (error instanceof EmailSameAsCurrentException) {
        this.emailError.set(error.message);
        return;
      } else if (error instanceof RateLimitException) {
        this.emailError.set(error.message);
        return;
      }

      this.snackbarService.show("Failed to update email", "error");
    } finally {
      this.loadingEmail.set(false);
    }
  }

  async onSaveAvatar() {
    if (!this.canUpdateAvatar() || !this.isAvatarValid()) {
      this.snackbarService.show("You can't update your avatar", "error");
      return;
    }

    try {
      this.loadingAvatar.set(true);
      await this.userService.updateAvatar(this.avatarUrl());
      this.snackbarService.show("Avatar updated successfully", "success", 3000);
    } catch (error) {
      this.snackbarService.show("Failed to update avatar", "error");
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
      this.loadingService.setLoading(true);
      await this.userService.deactivate();
      this.loadingService.setLoading(false);
      this.router.navigate(["/"]);
      this.snackbarService.show(
        "Account deactivated successfully",
        "success",
        3000
      );
    } catch (error) {
      this.snackbarService.show("Failed to deactivate account", "error");
    } finally {
      this.loadingService.setLoading(false);
    }
  }

  async onConfirmVerifyEmail() {
    const code = this.verifyEmailInput.value;
    if (!code) {
      this.snackbarService.show("Please enter a code", "error");
      return;
    }

    try {
      this.loadingVerifyEmail.set(true);
      await this.userService.verifyEmail(code);
      this.isVerifyEmailModalOpen.set(false);
      this.snackbarService.show("Email verified successfully", "success", 3000);
    } catch (error) {
      if (error instanceof InvalidCodeException) {
        this.snackbarService.show(error.message, "error");
      } else {
        this.snackbarService.show("Failed to verify email", "error");
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

  ngOnDestroy(): void {
    this.subUntilDestroyed$.next();
    this.subUntilDestroyed$.complete();
  }
}
