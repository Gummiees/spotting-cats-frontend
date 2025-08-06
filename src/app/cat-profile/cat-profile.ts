import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  Signal,
  signal,
  AfterViewInit,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import {
  LeafletDirective,
  LeafletLayersDirective,
} from "@bluehalo/ngx-leaflet";
import { Layer, MapOptions } from "leaflet";
import { Subscription } from "rxjs";

import { NotFound } from "../not-found/not-found";
import { CatBadges } from "../shared/components/cat-badges/cat-badges";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { IconButton } from "@shared/components/icon-button/icon-button";
import { Carousel, CarouselItem } from "@shared/components/carousel/carousel";
import { Modal } from "@shared/components/modal/modal";
import { AuthStateService } from "@shared/services/auth-state.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { LoginModalService } from "@shared/services/login-modal.service";
import { CatsService } from "@shared/services/cats.service";
import { MinutesAgoPipe } from "@shared/pipes/minutes-ago.pipe";
import { Cat } from "@models/cat";
import { MapService } from "@shared/services/map.service";
import { CatAddress } from "@shared/components/cat-address/cat-address";

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
    LeafletDirective,
    LeafletLayersDirective,
    CatAddress,
  ],
})
export class CatProfile implements OnInit, OnDestroy, AfterViewInit {
  cat = signal<Cat | null>(null);
  catNotFound = signal(false);
  loadingLike = signal(false);
  loadingDelete = signal(false);
  isDeleteModalOpen = signal(false);
  private catSubscription!: Subscription;

  @ViewChild(LeafletDirective) mapDirective!: LeafletDirective;

  get carouselItems(): Signal<CarouselItem[] | undefined> {
    return computed(() =>
      this.cat()?.imageUrls.map((imageUrl, index) => ({
        imageUrl,
        altText: this.cat()?.name ?? `Cat ${index + 1}`,
      }))
    );
  }

  get isCurrentUserOwner() {
    const currentUsername = this.authStateService.user()?.username;
    return !!currentUsername && currentUsername === this.cat()?.username;
  }

  get leafletOptions(): Signal<MapOptions> {
    return computed(() => {
      const cat = this.cat();
      return MapService.getLeafletMapOptions({
        latitude: cat?.yCoordinate,
        longitude: cat?.xCoordinate,
      });
    });
  }

  get leafletLayers(): Signal<Layer[]> {
    return computed(() => {
      const cat = this.cat();
      if (!cat || !cat.xCoordinate || !cat.yCoordinate) {
        return [];
      }

      const marker = MapService.getLeafletMarker({
        name: cat.name ?? "Cat",
        latitude: cat.yCoordinate,
        longitude: cat.xCoordinate,
      });

      if (!marker) {
        return [];
      }
      marker.on("add", () => marker.openPopup());
      return [marker];
    });
  }

  constructor(
    private authStateService: AuthStateService,
    private route: ActivatedRoute,
    private loginModalService: LoginModalService,
    private catsService: CatsService,
    private snackbarService: SnackbarService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.catSubscription = this.route.data.subscribe({
      next: (data) => {
        const resolverData = data["cat"] as Cat | null;

        if (resolverData === null) {
          this.cat.set(null);
          this.catNotFound.set(true);
        } else {
          this.cat.set(resolverData);
          this.catNotFound.set(false);
        }
      },
      error: (_) => {
        this.catNotFound.set(true);
      },
    });
  }

  ngAfterViewInit(): void {
    // Trigger map resize after view is initialized to ensure proper centering
    setTimeout(() => {
      if (this.mapDirective?.map) {
        this.mapDirective.map.invalidateSize();
      }
    }, 100);
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
      this.router.navigate(["/cats"]);
      this.snackbarService.show("Cat deleted successfully", "success");
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
    this.router.navigate(["/cat", this.cat()?.id, "edit"]);
  }

  async onDeleteClick(event: MouseEvent) {
    event.stopPropagation();
    this.isDeleteModalOpen.set(true);
  }

  ngOnDestroy(): void {
    this.catSubscription.unsubscribe();
  }
}
