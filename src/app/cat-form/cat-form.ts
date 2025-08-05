import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  Signal,
  computed,
  effect,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Subscription } from "rxjs";

import { Cat, CreateCat, UpdateCat } from "@models/cat";
import { AuthStateService } from "@shared/services/auth-state.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { NotFound } from "../not-found/not-found";
import { IconButton } from "@shared/components/icon-button/icon-button";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import {
  CatsService,
  NsfwContentDetectedException,
} from "@shared/services/cats.service";
import { LoginModalService } from "@shared/services/login-modal.service";
import { ImageInput } from "@shared/components/image-input/image-input";
import { positiveIntegerValidator } from "@shared/validators/positive-integer.validator";
import { breedValidator } from "@shared/validators/breed.validator";
import { Header } from "@shared/components/header/header";
import { NullableSwitch } from "@shared/components/nullable-switch/nullable-switch";
import {
  SearchableDropdown,
  SearchableDropdownOption,
} from "@shared/components/searchable-dropdown/searchable-dropdown";

@Component({
  selector: "app-cat-form",
  templateUrl: "./cat-form.html",
  standalone: true,
  imports: [
    CommonModule,
    NotFound,
    ImageInput,
    NullableSwitch,
    Header,
    PrimaryButton,
    IconButton,
    ReactiveFormsModule,
    SearchableDropdown,
  ],
})
export class CatForm implements OnInit, OnDestroy {
  readonly MAX_IMAGES = 10;
  cat = signal<Cat | null>(null);
  catNotFound = signal(false);
  triggerFileInput = signal<boolean>(false);
  files = signal<File[] | null>(null);
  private imageUrls = new Map<File, string>();
  private breeds = signal<string[]>([]);

  breedOptions = computed((): SearchableDropdownOption[] => {
    return this.breeds().map((breed, index) => ({
      id: `breed-${index}`,
      label: breed,
      value: breed,
    }));
  });
  isBreedDropdownOpen = signal(false);

  catForm = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    xCoordinate: new FormControl<number>(0, [Validators.required]),
    yCoordinate: new FormControl<number>(0, [Validators.required]),
    age: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(30),
      positiveIntegerValidator(),
    ]),
    breed: new FormControl<string | null>(null, [Validators.maxLength(100)]),
    extraInfo: new FormControl<string | null>(null, [
      Validators.maxLength(1000),
    ]),
    isDomestic: new FormControl<boolean | null>(null),
    isMale: new FormControl<boolean | null>(null),
    isSterilized: new FormControl<boolean | null>(null),
    isFriendly: new FormControl<boolean | null>(null),
    keepImages: new FormControl<string[] | null>(null),
    replaceImages: new FormControl<boolean | null>(null),
  });

  get title(): Signal<string> {
    return computed(() => (this.cat() ? "Edit cat" : "Create cat"));
  }

  get isLoading(): Signal<boolean> {
    return computed(() => this.isLoadingApiCall() || this.isProcessingFiles());
  }

  get isImageLimitReached(): Signal<boolean> {
    return computed(() => {
      const currentFiles = this.files();
      return currentFiles ? currentFiles.length >= this.MAX_IMAGES : false;
    });
  }

  private isLoadingApiCall = signal(false);
  private isProcessingFiles = signal(false);
  private routeDataSubscription!: Subscription;

  private get user() {
    return this.authStateService.user();
  }

  constructor(
    private snackbarService: SnackbarService,
    private authStateService: AuthStateService,
    private route: ActivatedRoute,
    private catsService: CatsService,
    private router: Router,
    private loginModalService: LoginModalService
  ) {
    effect(() => {
      if (this.isLoading()) {
        this.catForm.disable();
      } else {
        this.catForm.enable();
      }
    });
  }

  ngOnInit(): void {
    this.routeDataSubscription = this.route.data.subscribe({
      next: (data) => {
        this.breeds.set(data?.["breedsData"]?.breeds || []);
        this.catForm
          .get("breed")
          ?.setValidators([
            Validators.maxLength(100),
            breedValidator(this.breeds()),
          ]);
        this.catForm.updateValueAndValidity();

        const isCreateMode = this.route.snapshot.url.some(
          (segment) => segment.path === "add"
        );
        if (isCreateMode) {
          this.catNotFound.set(false);
          return;
        }

        const resolverData = data?.["data"] as {
          cat: Cat | null;
        } | null;
        if (resolverData === null) {
          this.catNotFound.set(true);
          return;
        }

        const { cat } = resolverData;
        if (cat === null) {
          this.catNotFound.set(true);
          return;
        }

        this.cat.set(cat);
        this.catForm.patchValue({
          name: cat.name,
          xCoordinate: cat.xCoordinate,
          yCoordinate: cat.yCoordinate,
          age: cat.age,
          breed: cat.breed,
          extraInfo: cat.extraInfo,
          isDomestic: cat.isDomestic,
          isMale: cat.isMale,
          isSterilized: cat.isSterilized,
          isFriendly: cat.isFriendly,
          keepImages: cat.imageUrls,
          replaceImages: null,
        });
        this.catForm.updateValueAndValidity();
        this.catNotFound.set(false);
      },
      error: (_) => {
        this.catNotFound.set(true);
      },
    });
  }

  onUploadPhotosClick() {
    this.triggerFileInput.set(true);
    setTimeout(() => this.triggerFileInput.set(false), 100);
  }

  onFilesSelected() {
    this.isProcessingFiles.set(true);
  }

  onFilesProcessed(files: File[]) {
    const currentFiles = this.files() || [];

    // Filter out duplicate files
    const newFiles = files.filter(
      (newFile) =>
        !currentFiles.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.size === newFile.size &&
            existingFile.lastModified === newFile.lastModified
        )
    );

    const maxNewFiles = this.MAX_IMAGES - currentFiles.length;
    const filesToAdd = newFiles.slice(0, maxNewFiles);
    const rejectedCount = newFiles.length - filesToAdd.length;

    if (rejectedCount > 0) {
      this.snackbarService.show(
        `Maximum ${this.MAX_IMAGES} images allowed. ${rejectedCount} image${
          rejectedCount > 1 ? "s" : ""
        } were not added.`,
        "warning"
      );
    }

    // Show message if duplicates were found
    const duplicateCount = files.length - newFiles.length;
    if (duplicateCount > 0) {
      this.snackbarService.show(
        `${duplicateCount} duplicate image${
          duplicateCount > 1 ? "s" : ""
        } were skipped.`,
        "warning"
      );
    }

    this.files.set([...currentFiles, ...filesToAdd]);
    this.isProcessingFiles.set(false);
  }

  onFilesError(error: string) {
    this.snackbarService.show(error, "error");
    this.isProcessingFiles.set(false);
  }

  getImageUrl(file: File): string {
    if (!this.imageUrls.has(file)) {
      this.imageUrls.set(file, URL.createObjectURL(file));
    }
    return this.imageUrls.get(file)!;
  }

  removeFile(fileToRemove: File): void {
    const currentFiles = this.files();
    if (currentFiles) {
      const updatedFiles = currentFiles.filter((file) => file !== fileToRemove);
      this.files.set(updatedFiles.length > 0 ? updatedFiles : null);

      const url = this.imageUrls.get(fileToRemove);
      if (url) {
        URL.revokeObjectURL(url);
        this.imageUrls.delete(fileToRemove);
      }
    }
  }

  onAgeKeydown(event: KeyboardEvent) {
    const invalidKeys = ["e", "E", "+", "-", "."];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onBreedSelectionChange(value: string | null) {
    this.catForm.patchValue({ breed: value });
  }

  onBreedDropdownOpenChange(isOpen: boolean) {
    this.isBreedDropdownOpen.set(isOpen);
  }

  getBooleanValueFromFormControlName(formControlName: string) {
    const value = this.catForm.get(formControlName)?.value;
    if (value === undefined || value === null) {
      return "Not sure";
    }
    return value ? "Yes" : "No";
  }

  getSexValue() {
    const value = this.catForm.get("isMale")?.value;
    if (value === undefined || value === null) {
      return "Not sure";
    }
    return value ? "Male" : "Female";
  }

  async onSaveClick() {
    const user = this.user;
    if (!user) {
      this.loginModalService.openModal();
      return;
    }

    if (this.catForm.invalid) {
      this.snackbarService.show("Please fill in all fields", "error");
      return;
    }

    const files = this.files();
    try {
      this.isLoadingApiCall.set(true);

      const cat = this.cat();
      if (!cat) {
        await this.createCat(files);
      } else {
        if (user.username !== cat.username) {
          this.authStateService.setUnauthenticated();
          return;
        }
        await this.updateCat(cat.id, files);
      }

      this.snackbarService.show("Cat saved successfully", "success");
    } catch (error) {
      if (error instanceof NsfwContentDetectedException) {
        this.snackbarService.show("NSFW content detected", "error");
      } else if (error instanceof Error) {
        this.snackbarService.show(error.message, "error");
      } else {
        this.snackbarService.show("Failed to save cat", "error");
      }
    } finally {
      this.isLoadingApiCall.set(false);
    }
  }

  private async createCat(files: File[] | null) {
    if (!files || files.length === 0) {
      throw new Error("Please select at least one image");
    }

    const catValue: CreateCat = {
      ...this.catForm.value,
      name: this.catForm.value.name!,
      xCoordinate: this.catForm.value.xCoordinate!,
      yCoordinate: this.catForm.value.yCoordinate!,
      age: this.catForm.value.age,
      breed: this.catForm.value.breed,
      extraInfo: this.catForm.value.extraInfo,
      isDomestic: this.catForm.value.isDomestic,
      isMale: this.catForm.value.isMale,
      isSterilized: this.catForm.value.isSterilized,
      isFriendly: this.catForm.value.isFriendly,
    };

    const cat = await this.catsService.addCat(catValue, files);
    this.router.navigate(["/cat", cat.id]);
  }

  private async updateCat(catId: string, files: File[] | null) {
    const catValue: UpdateCat = {
      ...this.catForm.value,
      name: this.catForm.value.name!,
      xCoordinate: this.catForm.value.xCoordinate!,
      yCoordinate: this.catForm.value.yCoordinate!,
      age: this.catForm.value.age,
      breed: this.catForm.value.breed,
      extraInfo: this.catForm.value.extraInfo,
      isDomestic: this.catForm.value.isDomestic,
      isMale: this.catForm.value.isMale,
      isSterilized: this.catForm.value.isSterilized,
      isFriendly: this.catForm.value.isFriendly,
      keepImages: this.catForm.value.keepImages,
      replaceImages: this.catForm.value.replaceImages,
    };

    await this.catsService.updateCat(catId, catValue, files);
    this.router.navigate(["/cat", catId]);
  }

  ngOnDestroy(): void {
    this.routeDataSubscription.unsubscribe();

    // Clean up object URLs to prevent memory leaks
    this.imageUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    this.imageUrls.clear();
  }
}
