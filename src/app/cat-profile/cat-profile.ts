import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthStateService } from "@shared/services/auth-state.service";
import { ReactiveFormsModule } from "@angular/forms";
import { NotFound } from "../not-found/not-found";
import { Subscription } from "rxjs";
import { Cat } from "@models/cat";
import { CatBadges } from "../cats/components/cat-badges/cat-badges";
import { Carousel, CarouselItem } from "@shared/components/carousel/carousel";
import { LoginModalService } from "@shared/services/login-modal.service";
import { CatsService } from "@shared/services/cats.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { MinutesAgoPipe } from "@shared/pipes/minutes-ago.pipe";
import { Modal } from "@shared/components/modal/modal";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { IconButton } from "@shared/components/icon-button/icon-button";

@Component({
  selector: "app-cat-profile",
  templateUrl: "./cat-profile.html",
  standalone: true,
  imports: [
    CommonModule,
    CatBadges,
    ReactiveFormsModule,
    NotFound,
    MinutesAgoPipe,
    RouterLink,
    Carousel,
    Modal,
    ModalContentSimple,
    IconButton,
  ],
})
export class CatProfile implements OnInit, OnDestroy {
  cat = signal<Cat | null>(null);
  catNotFound = signal(false);
  loadingLike = signal(false);
  loadingDelete = signal(false);
  isDeleteModalOpen = signal(false);
  private catSubscription!: Subscription;

  get carouselItems(): Signal<CarouselItem[] | undefined> {
    return computed(() =>
      this.cat()?.imageUrls.map((imageUrl, index) => ({
        imageUrl,
        altText: this.cat()?.name ?? `Cat ${index + 1}`,
      }))
    );
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute,
    private loginModalService: LoginModalService,
    private catsService: CatsService,
    private snackbarService: SnackbarService,
    private router: Router
  ) {}

  get isCurrentUserOwner() {
    const currentUsername = this.authStateService.user()?.username;
    return !!currentUsername && currentUsername === this.cat()?.username;
  }

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

  onDeleteModalClose() {
    this.isDeleteModalOpen.set(false);
  }

  async onConfirmDelete() {
    if (!this.isCurrentUserOwner) {
      this.authStateService.setUnauthenticated();
      return;
    }
    const cat = this.cat();
    if (!cat) {
      this.snackbarService.show("Cat not found", "error");
      this.router.navigate(["/cats"]);
      return;
    }

    this.loadingDelete.set(true);
    try {
      await this.catsService.deleteCat(cat.id);
    } catch (error) {
      this.snackbarService.show("Failed to delete cat", "error");
    } finally {
      this.loadingDelete.set(false);
    }
  }

  async onLikeClick(event: MouseEvent) {
    event.stopPropagation();
    const cat = this.cat();

    if (this.loadingLike() || !cat) {
      return;
    }

    if (!this.authStateService.user()) {
      this.loginModalService.openModal();
      return;
    }

    this.loadingLike.set(true);
    try {
      await this.catsService.likeCat(cat.id);
      this.cat.update((cat) =>
        cat
          ? {
              ...cat,
              isLiked: !cat.isLiked,
              totalLikes: cat.isLiked ? cat.totalLikes - 1 : cat.totalLikes + 1,
            }
          : null
      );
    } catch (error) {
      this.snackbarService.show("Failed to like cat", "error");
    } finally {
      this.loadingLike.set(false);
    }
  }

  async onEditClick(event: MouseEvent) {
    event.stopPropagation();
    console.log("edit");
  }

  async onDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    this.isDeleteModalOpen.set(true);
  }

  ngOnDestroy(): void {
    this.catSubscription.unsubscribe();
  }
}
