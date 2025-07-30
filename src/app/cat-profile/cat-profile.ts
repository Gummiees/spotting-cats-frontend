import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  computed,
  Signal,
} from "@angular/core";
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
import { Cat } from "@models/cat";
import { OwnUser } from "@models/own-user";

@Component({
  selector: "app-cat-profile",
  templateUrl: "./cat-profile.html",
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
export class CatProfile implements OnInit, OnDestroy {
  cat = signal<Cat | null>(null);
  catNotFound = signal(false);
  private catSubscription!: Subscription;

  private get loggedInUser(): OwnUser | null {
    return this.authStateService.user();
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.catSubscription = this.route.data.subscribe({
      next: (data) => {
        const cat = data["cat"] as Cat | null;
        this.cat.set(cat);
        this.catNotFound.set(cat === null);
      },
      error: (_) => {
        this.catNotFound.set(true);
      },
    });
  }

  get isOwnerBanned(): Signal<boolean> {
    return computed(() => this.cat()?.username === this.loggedInUser?.username);
  }

  get loggedInUserHasElevatedRole(): Signal<boolean> {
    return computed(
      () => !!this.loggedInUser && isPrivilegedRole(this.loggedInUser.role)
    );
  }

  ngOnDestroy(): void {
    this.catSubscription.unsubscribe();
  }
}
