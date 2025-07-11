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
  selector: "app-verify-code",
  templateUrl: "./verify-code.html",
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class VerifyCode {
  verifyCodeForm: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.verifyCodeForm = this.fb.group({
      code: ["", [Validators.required]],
    });
  }

  public async onSubmit() {
    this.loading.set(true);
    try {
      await this.userService.verifyCode(this.verifyCodeForm.value.code);
      this.router.navigate(["/"]);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
