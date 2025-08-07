import {
  Component,
  OnInit,
  signal,
  computed,
  HostListener,
  Signal,
  QueryList,
  ViewChildren,
  ElementRef,
} from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { Cat } from "@models/cat";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import { SnackbarService } from "@shared/services/snackbar.service";
import { AuthStateService } from "@shared/services/auth-state.service";
import { CatCard } from "./components/cat-card/cat-card";
import { CatsFilter, CatsService } from "@shared/services/cats.service";
import { EmptyCatCard } from "./components/empty-cat-card/empty-cat-card";
import { MAX_CATS_PER_PAGE } from "@shared/services/cats.service";
import { LoginModalService } from "@shared/services/login-modal.service";
import { Router } from "@angular/router";
import { CatsMap } from "./components/cats-map/cats-map";
import { MapService } from "@shared/services/map.service";
import { LatLng, latLng } from "leaflet";

@Component({
  selector: "app-cats",
  templateUrl: "./cats.html",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PrimaryButton,
    CatCard,
    EmptyCatCard,
    CatsMap,
  ],
})
export class CatsComponent implements OnInit {
  cats = signal<Cat[]>([]);
  loading = signal<boolean>(false);
  loadingLike = signal<boolean>(false);
  selectedCatId = signal<string | null>(null);
  userCoords = signal<LatLng | null>(null);

  @ViewChildren("catCard", { read: ElementRef })
  catCardElements!: QueryList<ElementRef>;

  sortedCats: Signal<Cat[]> = computed(() => {
    const cats = this.cats();
    const userCoords = this.userCoords();

    if (!userCoords || cats.length === 0) {
      return cats;
    }

    const validCats = cats.filter(
      (cat) =>
        cat.xCoordinate != null &&
        cat.yCoordinate != null &&
        !isNaN(cat.xCoordinate) &&
        !isNaN(cat.yCoordinate)
    );

    // Sort cats by distance from user location
    return [...validCats].sort((a, b) => {
      const distanceA = MapService.calculateDistance(
        userCoords.lat,
        userCoords.lng,
        a.yCoordinate,
        a.xCoordinate
      );
      const distanceB = MapService.calculateDistance(
        userCoords.lat,
        userCoords.lng,
        b.yCoordinate,
        b.xCoordinate
      );
      return distanceA - distanceB;
    });
  });

  emptyItems: Signal<null[]> = computed(() => {
    const items: null[] = [];
    const catsCount = this.cats().length;
    if (catsCount === 0 || catsCount === MAX_CATS_PER_PAGE) {
      return [];
    }

    const columnsPerRow = this.currentColumns();
    const totalSlots = Math.ceil(catsCount / columnsPerRow) * columnsPerRow;
    const emptySlots = totalSlots - catsCount;

    for (let i = 0; i < emptySlots; i++) {
      items.push(null);
    }

    return items;
  });
  hasMoreCats = computed(() => {
    return this.cats().length === MAX_CATS_PER_PAGE;
  });

  private currentColumns = signal<number>(1);

  private get user() {
    return this.authStateService.user();
  }

  private get currentPage() {
    return Math.floor(this.cats().length / MAX_CATS_PER_PAGE) + 1;
  }

  constructor(
    private catsService: CatsService,
    private snackbarService: SnackbarService,
    private authStateService: AuthStateService,
    private loginModalService: LoginModalService,
    private router: Router
  ) {}

  @HostListener("window:resize")
  onResize() {
    this.updateColumnsPerRow();
  }

  ngOnInit() {
    this.updateColumnsPerRow();
    this.loadCats();
    this.getUserLocation();
  }

  private updateColumnsPerRow() {
    const width = window.innerWidth;

    // Match Tailwind breakpoints:
    // sm: 640px, lg: 1024px, xl: 1280px
    if (width >= 1280) {
      this.currentColumns.set(4); // xl:grid-cols-4
    } else if (width >= 1024) {
      this.currentColumns.set(3); // lg:grid-cols-3
    } else if (width >= 640) {
      this.currentColumns.set(2); // sm:grid-cols-2
    } else {
      this.currentColumns.set(1); // grid-cols-1
    }
  }

  private async loadCats(
    { filter, isReload }: { filter?: CatsFilter; isReload?: boolean } = {
      isReload: false,
    }
  ) {
    this.loading.set(true);
    try {
      const newCats = await this.catsService.getCats(filter);
      const filteredCats = this.cats().filter(
        (cat) => !newCats.some((c) => c.id === cat.id)
      );
      if (isReload) {
        this.cats.set(newCats);
      } else {
        this.cats.set([...filteredCats, ...newCats]);
      }
    } catch (error) {
      this.snackbarService.show("Error loading cats", "error");
    } finally {
      this.loading.set(false);
    }
  }

  async onAddCatClick() {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }

    this.router.navigate(["/cat/add"]);
  }

  onLoadMoreCats() {
    this.loadCats({ filter: { page: this.currentPage } });
  }

  onReloadCats() {
    this.loadCats({ isReload: true });
  }

  get isLoadingLike() {
    return this.loadingLike();
  }

  async onLikeCat(catId: string) {
    if (this.loadingLike()) {
      return;
    }

    if (!this.authStateService.user()) {
      this.loginModalService.openModal();
      return;
    }

    this.loadingLike.set(true);
    try {
      await this.catsService.likeCat(catId);
      this.cats.update((cats) =>
        cats.map((cat) =>
          cat.id === catId
            ? {
                ...cat,
                isLiked: !cat.isLiked,
                totalLikes: cat.isLiked
                  ? cat.totalLikes - 1
                  : cat.totalLikes + 1,
              }
            : cat
        )
      );
    } catch (error) {
      this.snackbarService.show("Failed to like cat", "error");
    } finally {
      this.loadingLike.set(false);
    }
  }

  onCatSelected(catId: string) {
    this.scrollToCat(catId);
  }

  private scrollToCat(catId: string) {
    const catIndex = this.sortedCats().findIndex((cat) => cat.id === catId);
    if (catIndex !== -1 && this.catCardElements) {
      const catCardElement = this.catCardElements.toArray()[catIndex];
      if (catCardElement) {
        const element = catCardElement.nativeElement;

        // Listen for scroll end event
        const onScrollEnd = () => {
          this.selectedCatId.set(catId);

          // Clear selection after highlighting animation
          setTimeout(() => {
            this.selectedCatId.set(null);
          }, 3000);

          // Clean up listener
          document.removeEventListener("scrollend", onScrollEnd);
        };

        // Add scroll end listener
        document.addEventListener("scrollend", onScrollEnd, { once: true });

        // Fallback for browsers that don't support scrollend
        const fallbackTimeout = setTimeout(() => {
          document.removeEventListener("scrollend", onScrollEnd);
          onScrollEnd();
        }, 1000);

        // Clear fallback if scrollend fires
        document.addEventListener(
          "scrollend",
          () => {
            clearTimeout(fallbackTimeout);
          },
          { once: true }
        );

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }

  private async getUserLocation(): Promise<void> {
    try {
      const coords = await this.getPositionWithGeolocation();
      this.userCoords.set(coords);
    } catch (error) {
      // User location not available, continue without sorting by distance
      console.log("Geolocation not available:", error);
    }
  }

  private getPositionWithGeolocation(): Promise<LatLng> {
    return new Promise<LatLng>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = latLng(
            position.coords.latitude,
            position.coords.longitude
          );
          resolve(coords);
        },
        (error: GeolocationPositionError) => {
          reject(error);
        }
      );
    });
  }
}
