import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { Header } from "@shared/components/header/header";
import { ReactiveFormsModule } from "@angular/forms";
import { Badge } from "@shared/components/badge/badge";
import { ExternalUser } from "@models/external-user";
import { NotFound } from "../not-found/not-found";
import { isPrivilegedRole } from "@shared/utils/role-permissions";
import { Subscription } from "rxjs";
import { DaysAgoPipe } from "@shared/pipes/days-ago.pipe";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.html",
  standalone: true,
  imports: [
    CommonModule,
    Header,
    Badge,
    ReactiveFormsModule,
    NotFound,
    DaysAgoPipe,
    RouterLink,
  ],
})
export class Profile implements OnInit, OnDestroy {
  user = signal<ExternalUser | null>(null);
  userNotFound = signal(false);
  private userSubscription!: Subscription;

  get loggedInUser() {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.route.data.subscribe({
      next: (data) => {
        const user = data["user"] as ExternalUser | null;
        this.user.set(user);
        this.userNotFound.set(user === null);
      },
      error: (_) => {
        this.userNotFound.set(true);
      },
    });
  }

  get isUserBanned(): boolean {
    return this.user()?.isBanned || false;
  }

  get loggedInUserHasElevatedRole(): boolean {
    return !!this.loggedInUser && isPrivilegedRole(this.loggedInUser.role);
  }

  hasBadge(): boolean {
    const user = this.user();
    return (
      !!user &&
      (user.role === "superadmin" ||
        user.role === "admin" ||
        user.role === "moderator" ||
        user.isBanned ||
        user.isInactive)
    );
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }
}
