import { Component, input, output, signal, OnDestroy } from "@angular/core";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { Modal } from "@shared/components/modal/modal";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UserService } from "@shared/services/user.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import {
  ForbiddenException,
  RateLimitException,
} from "@shared/services/admin.service";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";

@Component({
  selector: "app-login-modal",
  templateUrl: "./login-modal.html",
  standalone: true,
  imports: [
    Modal,
    ModalContentSimple,
    ReactiveFormsModule,
    CommonModule,
    PrimaryButton,
  ],
})
export class LoginModal implements OnDestroy {
  isOpen = input<boolean>(false);
  onCancel = output<void>();
  onSuccessfulLogin = output<void>();

  loadingButton = signal(false);
  email = signal<string | null>(null);
  resendTimeLeft = signal<number>(0);
  emailInput = new FormControl("", [Validators.required, Validators.email]);
  codeInput = new FormControl("", [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(6),
  ]);

  private resendTimer: number | null = null;

  constructor(
    private userService: UserService,
    private snackbarService: SnackbarService
  ) {}

  async onConfirmModal() {
    if (this.email()) {
      await this.validateCodeAndVerify();
    } else {
      await this.validateEmailAndSendCode();
    }
  }

  private async validateCodeAndVerify() {
    if (this.isCodeInvalid || !this.codeInput.value) {
      this.snackbarService.show("Please enter a valid code", "error");
      return;
    }
    await this.verifyCode(this.codeInput.value);
  }

  private async validateEmailAndSendCode() {
    if (this.isEmailInvalid || !this.emailInput.value) {
      this.snackbarService.show("Please enter a valid email", "error");
      return;
    }
    if (!this.canResendCode()) {
      this.snackbarService.show(
        "You can only resend the code every 60 seconds",
        "error"
      );
      return;
    }
    await this.sendCode(this.emailInput.value.trim().toLowerCase());
  }

  private async sendCode(email: string) {
    this.loadingButton.set(true);
    try {
      await this.userService.sendCode(email);
      this.email.set(email);
      this.startResendTimer();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        this.snackbarService.show(error.message, "error");
        return;
      }
      if (error instanceof RateLimitException) {
        this.snackbarService.show(
          "You have reached the maximum number of requests. Please try again later.",
          "error"
        );
        return;
      }
      this.snackbarService.show(
        "An error occurred while sending the code",
        "error"
      );
      this.email.set(null);
    } finally {
      this.loadingButton.set(false);
    }
  }

  private async verifyCode(code: string) {
    this.loadingButton.set(true);
    try {
      await this.userService.verifyCode(code);
      this.email.set(null);
      this.emailInput.reset();
      this.codeInput.reset();
      this.onSuccessfulLogin.emit();
    } catch (error) {
      this.snackbarService.show(
        "An error occurred while verifying the code",
        "error"
      );
    } finally {
      this.loadingButton.set(false);
    }
  }

  async onCancelModal() {
    this.email() ? this.resetInputs() : this.onCancel.emit();
  }

  async onResendCode() {
    await this.validateEmailAndSendCode();
  }

  private canResendCode(): boolean {
    return this.resendTimeLeft() === 0;
  }

  private resetInputs() {
    this.emailInput.reset();
    this.codeInput.reset();
    this.email.set(null);
    this.stopResendTimer();
  }

  private startResendTimer() {
    this.stopResendTimer();
    this.resendTimeLeft.set(60);

    this.resendTimer = setInterval(() => {
      const timeLeft = this.resendTimeLeft();
      if (timeLeft > 0) {
        this.resendTimeLeft.set(timeLeft - 1);
      } else {
        this.stopResendTimer();
      }
    }, 1000);
  }

  private stopResendTimer() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }

  ngOnDestroy() {
    this.stopResendTimer();
  }

  get title(): string {
    return this.email() ? "Verify Email" : "Login";
  }

  get message(): string {
    return this.email()
      ? "Please enter the code sent to your email."
      : "Please enter your email to login.";
  }

  get inputType(): string {
    return this.email() ? "number" : "email";
  }

  get inputPlaceholder(): string {
    return this.email() ? "Enter code" : "Enter email";
  }

  get autocomplete(): string {
    return this.email() ? "one-time-code" : "email";
  }

  get confirmText(): string {
    return this.email() ? "Verify" : "Send code";
  }

  get cancelText(): string {
    return this.email() ? "Return" : "Cancel";
  }

  get isFullWidth(): boolean {
    return !this.email();
  }

  get input(): FormControl {
    return this.email() ? this.codeInput : this.emailInput;
  }

  get isDisabled(): boolean {
    return (
      this.loadingButton() ||
      (!this.email() && this.isEmailInvalid) ||
      (!!this.email() && this.isCodeInvalid)
    );
  }

  get shouldDisplayResendButton(): boolean {
    return !!this.email() && !!this.emailInput.valid && !!this.emailInput.value;
  }

  get isResendButtonDisabled(): boolean {
    return !this.canResendCode();
  }

  get resendButtonText(): string {
    return this.canResendCode()
      ? "Resend code"
      : `Resend code in ${this.resendTimeLeft()} seconds`;
  }

  private get isEmailInvalid(): boolean {
    return this.emailInput.invalid || this.emailInput.pristine;
  }

  private get isCodeInvalid(): boolean {
    return this.codeInput.invalid || this.codeInput.pristine;
  }
}
