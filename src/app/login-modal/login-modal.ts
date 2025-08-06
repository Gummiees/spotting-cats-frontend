import { Component, input, output, signal, OnDestroy } from "@angular/core";
import { Modal } from "@shared/components/modal/modal";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UserService, RateLimitException } from "@shared/services/user.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import { SecondaryButton } from "@shared/components/secondary-button/secondary-button";
import { stricterEmailValidator } from "@shared/validators/stricter-email.validator";

@Component({
  selector: "app-login-modal",
  templateUrl: "./login-modal.html",
  standalone: true,
  imports: [
    Modal,
    SecondaryButton,
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
  isOnCodeStep = signal(false);
  resendTimeLeft = signal<number>(0);
  emailForm = new FormGroup({
    email: new FormControl<string | null>(null, [
      Validators.required,
      stricterEmailValidator(),
      Validators.email,
    ]),
  });
  codeForm = new FormGroup({
    code: new FormControl<string | null>(null, [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ]),
  });

  private lastEmailSentCodeTo = signal<string | null>(null);
  private resendTimer: number | null = null;

  constructor(
    private userService: UserService,
    private snackbarService: SnackbarService
  ) {}

  async onConfirmModal() {
    if (this.isOnCodeStep()) {
      await this.validateCodeAndVerify();
    } else {
      await this.validateEmailAndSendCode();
    }
  }

  private async validateCodeAndVerify() {
    if (this.codeForm.invalid || !this.codeForm.value.code) {
      this.snackbarService.show("Please enter a valid code", "error");
      return;
    }
    await this.verifyCode(this.codeForm.value.code);
  }

  private async validateEmailAndSendCode() {
    if (this.emailForm.invalid || !this.emailForm.value.email) {
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
    await this.sendCode(this.emailForm.value.email.trim().toLowerCase());
  }

  private async sendCode(email: string) {
    this.loadingButton.set(true);
    this.emailForm.disable();
    try {
      await this.userService.sendCode(email);
      this.email.set(email);
      this.lastEmailSentCodeTo.set(email);
      this.isOnCodeStep.set(true);
      this.startResendTimer();
    } catch (error) {
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
      this.emailForm.enable();
    }
  }

  private async verifyCode(code: string) {
    this.loadingButton.set(true);
    this.codeForm.disable();
    try {
      await this.userService.verifyCode(code);
      this.email.set(null);
      this.emailForm.reset();
      this.onSuccessfulLogin.emit();
    } catch (error) {
      this.snackbarService.show(
        "An error occurred while verifying the code",
        "error"
      );
    } finally {
      this.loadingButton.set(false);
      this.codeForm.enable();
    }
  }

  async onCancelModal() {
    this.isOnCodeStep() ? this.resetCodeInput() : this.onExit();
  }

  async onResendCode() {
    await this.validateEmailAndSendCode();
  }

  private canResendCode(): boolean {
    return (
      this.resendTimeLeft() === 0 ||
      this.lastEmailSentCodeTo() !== this.emailForm.value.email
    );
  }

  private resetCodeInput() {
    this.codeForm.reset();
    this.stopResendTimer();
    this.resendTimeLeft.set(0);
    this.isOnCodeStep.set(false);
  }

  private onExit() {
    this.emailForm.reset();
    this.email.set(null);
    this.resetCodeInput();
    this.onCancel.emit();
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
    return this.isOnCodeStep() ? "Verify Email" : "Login";
  }

  get message(): string {
    return this.isOnCodeStep()
      ? `Please enter the code sent to the email ${this.email()}`
      : "Please enter your email to login.";
  }

  get confirmText(): string {
    return this.isOnCodeStep() ? "Verify" : "Send code";
  }

  get cancelText(): string {
    return this.isOnCodeStep() ? "Return" : "Cancel";
  }

  get isFullWidth(): boolean {
    return !this.isOnCodeStep();
  }

  get input(): FormControl {
    return this.isOnCodeStep()
      ? this.codeForm.controls.code
      : this.emailForm.controls.email;
  }

  get isDisabled(): boolean {
    return (
      this.loadingButton() ||
      (!this.isOnCodeStep() && this.isEmailStepDisabled) ||
      (this.isOnCodeStep() && this.codeForm.invalid)
    );
  }

  private get isEmailStepDisabled(): boolean {
    return (
      this.emailForm.invalid ||
      (this.lastEmailSentCodeTo() === this.emailForm.value.email &&
        this.resendTimeLeft() > 0)
    );
  }

  get shouldDisplayResendButton(): boolean {
    return (
      this.isOnCodeStep() &&
      !!this.emailForm.controls.email.valid &&
      !!this.emailForm.controls.email.value
    );
  }

  get isResendButtonDisabled(): boolean {
    return !this.canResendCode();
  }

  get resendButtonText(): string {
    return this.canResendCode()
      ? "Resend code"
      : `Resend code in ${this.resendTimeLeft()} seconds`;
  }
}
