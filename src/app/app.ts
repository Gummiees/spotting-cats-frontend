import {
  AfterViewInit,
  Component,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterEvent,
  RouterOutlet,
} from "@angular/router";
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
export class App implements OnInit, AfterViewInit {
  isLoginModalOpen = signal(false);
  isLoadingRoute = signal(false);

  @ViewChild("snackbar") snackbarComponent!: Snackbar;

  get isLoading() {
    return this.loadingService.loading;
  }

  constructor(
    private authStateService: AuthStateService,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.authStateService.checkAuthStatus();
    this.routerEvents();
  }

  routerEvents() {
    this.router.events.subscribe((event) => {
      switch (true) {
        case event instanceof NavigationStart: {
          this.isLoadingRoute.set(true);
          break;
        }
        case event instanceof NavigationEnd: {
          this.isLoadingRoute.set(false);
          break;
        }
      }
    });
  }

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
