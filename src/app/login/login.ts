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

@Component({
  selector: "app-login",
  templateUrl: "./login.html",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class Login {
  loginForm: FormGroup;
  loading = signal(false);

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
    this.loading.set(true);
    try {
      await this.userService.sendCode(
        this.loginForm.value.email.trim().toLowerCase()
      );
      this.router.navigate(["/verify-code"]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
