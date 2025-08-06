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
import { CatFormImage } from "./cat-form-image/cat-form-image";
import { LeafletDirective } from "@bluehalo/ngx-leaflet";
import {
  Control,
  latLng,
  Map as LeafletMap,
  LeafletMouseEvent,
  MapOptions,
  marker,
  Marker,
} from "leaflet";
import { MapService } from "@shared/services/map.service";
import "leaflet-control-geocoder";

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
    ReactiveFormsModule,
    SearchableDropdown,
    CatFormImage,
    LeafletDirective,
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
  private map!: LeafletMap;
  private userMarker: Marker | null = null;

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
  });

  get title(): Signal<string> {
    return computed(() => (this.cat() ? "Edit cat" : "Create cat"));
  }

  get isLoading(): Signal<boolean> {
    return computed(() => this.isLoadingApiCall() || this.isProcessingFiles());
  }

  get totalImages(): Signal<number> {
    return computed(() => {
      const currentFiles = this.files() || [];
      const keepImages = this.catForm.get("keepImages")?.value || [];
      return currentFiles.length + keepImages.length;
    });
  }

  get isImageLimitReached(): Signal<boolean> {
    return computed(() => {
      return this.totalImages() >= this.MAX_IMAGES;
    });
  }

  get formImages(): Signal<string[]> {
    return computed(() => this.catForm.get("keepImages")?.value || []);
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
        const isCreateMode = this.route.snapshot.url.some(
          (segment) => segment.path === "add"
        );

        const resolverData = data?.["data"] as {
          cat: Cat | null;
          breeds: string[];
        } | null;

        if (resolverData === null) {
          this.catNotFound.set(true);
          return;
        }

        const { cat, breeds } = resolverData;

        this.breeds.set(breeds || []);
        this.catForm
          .get("breed")
          ?.setValidators([
            Validators.maxLength(100),
            breedValidator(this.breeds()),
          ]);

        if (isCreateMode) {
          this.catNotFound.set(false);
          return;
        }

        if (cat === null) {
          this.catNotFound.set(true);
          return;
        }
        this.cat.set(cat);
        this.catForm.patchValue({
          name: cat.name,
          age: cat.age,
          breed: cat.breed,
          extraInfo: cat.extraInfo,
          isDomestic: cat.isDomestic,
          isMale: cat.isMale,
          isSterilized: cat.isSterilized,
          isFriendly: cat.isFriendly,
          keepImages: cat.imageUrls,
        });
        this.userMarker = MapService.getUserMarker(
          latLng(cat.xCoordinate, cat.yCoordinate)
        );
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

  removeFormImage(imageUrl: string): void {
    const currentImages = this.formImages();
    const updatedImages = currentImages.filter((image) => image !== imageUrl);
    this.catForm.patchValue({ keepImages: updatedImages });
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

  get leafletOptions(): Signal<MapOptions> {
    return computed(() => {
      const cat = this.cat();
      return MapService.getLeafletMapOptions({
        latitude: cat?.xCoordinate,
        longitude: cat?.yCoordinate,
      });
    });
  }

  onMapReady(map: LeafletMap) {
    this.map = map;
    map.on("click", this.onMapClick.bind(this));
    this.setGeocoder();

    if (this.userMarker) {
      this.userMarker.addTo(map);
      map.setView(this.userMarker.getLatLng(), 18);
      return;
    }

    if (!navigator.geolocation) {
      this.snackbarService.show(
        "Geolocation is not supported by your browser",
        "error"
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = latLng(
          position.coords.latitude,
          position.coords.longitude
        );
        map.setView(coords, 15);
        this.userMarker = MapService.getUserMarker(coords)
          .bindPopup("You are here! Drag me or click on the cat's location", {
            closeButton: false,
          })
          .addTo(map);
      },
      (error: GeolocationPositionError) => {
        this.snackbarService.show(
          `Error getting location: ${error.message} (code: ${error.code})`,
          "error"
        );
        console.error(error);
        map.setView(MapService.getLeafletMapOptions({}).center!, 15);
      },
      {
        maximumAge: 60 * 60 * 1000, // 1 hour
      }
    );
  }

  private onMapClick(event: LeafletMouseEvent) {
    if (this.userMarker) {
      this.userMarker.remove();
    }
    this.userMarker = MapService.getUserMarker(event.latlng);
    if (this.userMarker) {
      this.userMarker.addTo(this.map);
    }
  }

  private setGeocoder() {
    const geocoder = (Control as any).geocoder({
      defaultMarkGeocode: false,
    });

    geocoder.on("markgeocode", (e: any) => {
      if (this.userMarker) {
        this.userMarker.remove();
      }
      const center = e.geocode.center;
      this.map.setView(center, 15);
      this.userMarker = MapService.getUserMarker(center).addTo(this.map);
    });

    geocoder.addTo(this.map);
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

    const userMarker = this.userMarker;
    if (!userMarker) {
      throw new Error("Please select the cat's location");
    }

    const catValue: CreateCat = {
      ...this.catForm.value,
      name: this.catForm.value.name!,
      xCoordinate: userMarker.getLatLng().lat,
      yCoordinate: userMarker.getLatLng().lng,
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
    if (!this.totalImages()) {
      throw new Error("Please select at least one image");
    }

    const userMarker = this.userMarker;
    if (!userMarker) {
      throw new Error("Please select the cat's location");
    }

    const catValue: UpdateCat = {
      ...this.catForm.value,
      name: this.catForm.value.name!,
      xCoordinate: userMarker.getLatLng().lat,
      yCoordinate: userMarker.getLatLng().lng,
      age: this.catForm.value.age,
      breed: this.catForm.value.breed,
      extraInfo: this.catForm.value.extraInfo,
      isDomestic: this.catForm.value.isDomestic,
      isMale: this.catForm.value.isMale,
      isSterilized: this.catForm.value.isSterilized,
      isFriendly: this.catForm.value.isFriendly,
      keepImages: this.catForm.value.keepImages,
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
