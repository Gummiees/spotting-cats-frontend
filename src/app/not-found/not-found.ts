import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";

@Component({
  selector: "app-not-found",
  templateUrl: "./not-found.html",
  standalone: true,
  imports: [CommonModule, PrimaryButton],
})
export class NotFound {
  constructor(private router: Router) {}

  goToHome() {
    this.router.navigate(["/"]);
  }
}
