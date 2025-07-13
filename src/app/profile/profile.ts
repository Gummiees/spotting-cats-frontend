import { Component, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Modal } from "@shared/components/modal/modal";
import { Header } from "@shared/components/header/header";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { AdminBadge } from "@shared/components/admin-badge/admin-badge";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoadingService } from "@shared/services/loading.service";
import { AdminService } from "@shared/services/admin.service";
import { ExternalUser } from "@models/external-user";
import { NotFound } from "../not-found/not-found";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.html",
  standalone: true,
  imports: [
    CommonModule,
    Modal,
    Header,
    AdminBadge,
    ReactiveFormsModule,
    ModalContentSimple,
    NotFound,
  ],
})
export class Profile implements OnInit {
  loadingBan = signal(false);
  isBanModalOpen = signal(false);
  banReasonInput = new FormControl("", [Validators.required]);
  user = signal<ExternalUser | null>(null);

  get loggedInUser() {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private router: Router,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService,
    private loadingService: LoadingService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.user.set(data["user"] as ExternalUser);
    });
  }

  onBanUser() {
    this.isBanModalOpen.set(true);
  }

  onCancelBan() {
    this.isBanModalOpen.set(false);
  }

  async onConfirmBan() {
    const user = this.user();
    if (!user) {
      return;
    }

    try {
      this.loadingService.loading = true;
      await this.adminService.banUser(user.username, this.banReasonInput.value);
      this.loadingService.loading = false;
      this.snackbarService.show("Account banned successfully", "success", 3000);
    } catch (error) {
      console.error(error);
      this.snackbarService.show("Failed to deactivate account", "error");
    } finally {
      this.loadingService.loading = false;
    }
  }
}
