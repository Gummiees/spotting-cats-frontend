import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Navbar } from "@shared/components/navbar/navbar";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Snackbar } from "@shared/components/snackbar/snackbar";
import { SnackbarService } from "@shared/components/snackbar/snackbar.service";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, Navbar, Snackbar],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App implements OnInit, AfterViewInit {
  @ViewChild("snackbar") snackbarComponent!: Snackbar;
  constructor(
    private authStateService: AuthStateService,
    private snackbarService: SnackbarService
  ) {}

  async ngOnInit() {
    await this.authStateService.checkAuthStatus();
  }

  ngAfterViewInit() {
    this.snackbarService.register(this.snackbarComponent);
  }
}
