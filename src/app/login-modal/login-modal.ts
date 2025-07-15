import { Component, input, output, signal } from "@angular/core";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { Modal } from "@shared/components/modal/modal";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import {
  InvalidEmailException,
  UserService,
} from "@shared/services/user.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import {
  ForbiddenException,
  RateLimitException,
} from "@shared/services/admin.service";

@Component({
  selector: "app-login-modal",
  templateUrl: "./login-modal.html",
  standalone: true,
  imports: [Modal, ModalContentSimple, ReactiveFormsModule, CommonModule],
})
export class LoginModal {
  isOpen = input<boolean>(false);
  onCancel = output<void>();
  onSuccessfulLogin = output<void>();

  loadingButton = signal(false);
  email = signal<string | null>(null);
  emailInput = new FormControl("", [Validators.required, Validators.email]);
  codeInput = new FormControl("", [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(6),
  ]);

  constructor(
    private userService: UserService,
    private snackbarService: SnackbarService
  ) {}

  async onConfirmModal() {
    if (this.email()) {
      if (!this.codeInput.valid || !this.codeInput.value) {
        this.snackbarService.show("Please enter a valid code", "error");
        return;
      }
      await this.verifyCode(this.codeInput.value);
    } else {
      if (!this.emailInput.valid || !this.emailInput.value) {
        this.snackbarService.show("Please enter a valid email", "error");
        return;
      }
      await this.sendCode(this.emailInput.value.trim().toLowerCase());
    }
  }

  private async sendCode(email: string) {
    this.loadingButton.set(true);
    try {
      await this.userService.sendCode(email);
      this.email.set(email);
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

  private resetInputs() {
    this.emailInput.reset();
    this.codeInput.reset();
    this.email.set(null);
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

  private get isEmailInvalid(): boolean {
    return this.emailInput.invalid || this.emailInput.pristine;
  }

  private get isCodeInvalid(): boolean {
    return this.codeInput.invalid || this.codeInput.pristine;
  }
}
