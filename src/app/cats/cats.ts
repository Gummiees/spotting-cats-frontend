import {
  Component,
  OnInit,
  signal,
  computed,
  HostListener,
  Signal,
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
  ],
})
export class CatsComponent implements OnInit {
  cats = signal<Cat[]>([]);
  loading = signal<boolean>(false);
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
    private loginModalService: LoginModalService
  ) {}

  @HostListener("window:resize")
  onResize() {
    this.updateColumnsPerRow();
  }

  ngOnInit() {
    this.updateColumnsPerRow();
    this.loadCats();
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

  private async loadCats(filter?: CatsFilter) {
    this.loading.set(true);
    try {
      const newCats = await this.catsService.getCats(filter);
      const filteredCats = this.cats().filter(
        (cat) => !newCats.some((c) => c.id === cat.id)
      );
      this.cats.set([...filteredCats, ...newCats]);
    } catch (error) {
      this.snackbarService.show("Error loading cats", "error");
    } finally {
      this.loading.set(false);
    }
  }

  async onAddCat() {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }

    this.loading.set(true);
  }

  async onAddDefaultCat() {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }

    this.loading.set(true);
    try {
      await this.catsService.addCat({
        id: "",
        totalLikes: 3,
        imageUrls: [
          "https://cdn2.thecatapi.com/images/h5.jpg",
          "https://cdn2.thecatapi.com/images/a6q.jpg",
          "https://cdn2.thecatapi.com/images/bmh.jpg",
        ],
        xCoordinate: 40.925908,
        yCoordinate: -0.06771,
        isUserOwner: true,
        name: "Default Cat",
        age: 4,
        breed: "Tuxedo",
        extraInfo: "Lovely cat",
        isMale: false,
        isSterilized: true,
        isFriendly: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        confirmedOwnerAt: new Date(),
      });
      this.onLoadMoreCats();
    } catch (error) {
      this.snackbarService.show("Error adding cat", "error");
    } finally {
      this.loading.set(false);
    }
  }

  onLoadMoreCats() {
    this.loadCats({ page: this.currentPage });
  }
}
