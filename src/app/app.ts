import { AfterViewInit, Component, signal, ViewChild } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Navbar } from "@shared/components/navbar/navbar";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Snackbar } from "@shared/components/snackbar/snackbar";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";
import { Spinner } from "@shared/components/spinner/spinner";
import { ReactiveFormsModule } from "@angular/forms";
import { LoginModal } from "./login-modal/login-modal";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    Navbar,
    Snackbar,
    Spinner,
    ReactiveFormsModule,
    LoginModal,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.scss",
})
export class App implements AfterViewInit {
  isLoginModalOpen = signal(false);

  @ViewChild("snackbar") snackbarComponent!: Snackbar;

  get isLoading() {
    return this.loadingService.loading;
  }

  get isLoadingRoute() {
    return this.loadingService.routeLoading;
  }

  constructor(
    private authStateService: AuthStateService,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService
  ) {}

  ngAfterViewInit() {
    this.snackbarService.register(this.snackbarComponent);
  }

  closeLoginModal() {
    this.isLoginModalOpen.set(false);
  }

  openLoginModal() {
    this.isLoginModalOpen.set(true);
  }
}
