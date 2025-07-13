import { Component, signal } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { UserService } from "@shared/services/user.service";
import { Router } from "@angular/router";
import { LoadingButton } from "@shared/components/loading-button/loading-button";

@Component({
  selector: "app-login",
  templateUrl: "./login.html",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoadingButton],
})
export class Login {
  loginForm: FormGroup;
  loadingButton = signal(false);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  public async onSubmit() {
    this.loadingButton.set(true);
    try {
      await this.userService.sendCode(
        this.loginForm.value.email.trim().toLowerCase()
      );
      this.router.navigate(["/verify-code"]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingButton.set(false);
    }
  }
}
