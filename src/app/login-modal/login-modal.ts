import { Component, input, output, signal } from "@angular/core";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { Modal } from "@shared/components/modal/modal";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { LoadingButton } from "@shared/components/loading-button/loading-button";
import { CommonModule } from "@angular/common";
import { UserService } from "@shared/services/user.service";
import { SnackbarService } from "@shared/services/snackbar.service";

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
      this.snackbarService.show(
        "An error occurred while sending the code",
        "error"
      );
      this.email.set(null);
      console.error(error);
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
      console.error(error);
    } finally {
      this.loadingButton.set(false);
    }
  }

  async onCancelModal() {
    this.onCancel.emit();
  }

  getTitle(): string {
    return this.email() ? "Verify Email" : "Login";
  }

  getMessage(): string {
    return this.email()
      ? "Please enter the code sent to your email."
      : "Please enter your email to login.";
  }

  getInputType(): string {
    return this.email() ? "number" : "email";
  }

  getInputPlaceholder(): string {
    return this.email() ? "Enter code" : "Enter email";
  }

  getAutocomplete(): string {
    return this.email() ? "one-time-code" : "email";
  }

  getConfirmText(): string {
    return this.email() ? "Verify" : "Send code";
  }

  isFullWidth(): boolean {
    return !this.email();
  }

  getInput(): FormControl {
    return this.email() ? this.codeInput : this.emailInput;
  }
}
