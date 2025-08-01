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
import { ImageInput } from "@shared/components/image-input/image-input";
import { SnackbarService } from "@shared/services/snackbar.service";
import { AuthStateService } from "@shared/services/auth-state.service";
import { CatCard } from "./components/cat-card/cat-card";
import {
  CatsFilter,
  CatsService,
  NsfwContentDetectedException,
} from "@shared/services/cats.service";
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
    ImageInput,
    CatCard,
    EmptyCatCard,
  ],
})
export class CatsComponent implements OnInit {
  cats = signal<Cat[]>([]);
  loading = signal<boolean>(false);
  loadingLike = signal<boolean>(false);
  triggerFileInput = signal<boolean>(false);
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

  async onAddCat() {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }

    this.loading.set(true);
  }

  onUploadPhotosClick() {
    this.triggerFileInput.set(true);
    setTimeout(() => this.triggerFileInput.set(false), 100);
  }

  async onFileSelected() {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }

    this.loading.set(true);
  }

  onFileError(error: string) {
    this.snackbarService.show(error, "error");
    this.loading.set(false);
  }

  async onFileProcessed(files: File[]) {
    if (!this.user) {
      this.loginModalService.openModal();
      return;
    }

    try {
      await this.catsService.addCat(
        {
          xCoordinate: 40.925908,
          yCoordinate: -0.06771,
          name: "Cat with Photos",
          age: 3,
          breed: "Mixed",
          extraInfo: "Cat uploaded with photos",
          isMale: true,
          isSterilized: false,
          isFriendly: true,
        },
        files
      );
      this.onReloadCats();
      this.snackbarService.show(
        "Cat uploaded successfully with photos!",
        "success"
      );
    } catch (error) {
      if (error instanceof NsfwContentDetectedException) {
        this.snackbarService.show("NSFW content detected", "error");
        return;
      }
      this.snackbarService.show("Error uploading cat with photos", "error");
    } finally {
      this.loading.set(false);
    }
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
}
