import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
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
  ],
})
export class CatForm implements OnInit, OnDestroy {
  cat = signal<Cat | null>(null);
  catNotFound = signal(false);
  triggerFileInput = signal<boolean>(false);
  files = signal<File[] | null>(null);

  catForm = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required]),
    xCoordinate: new FormControl<number>(0, [Validators.required]),
    yCoordinate: new FormControl<number>(0, [Validators.required]),
    age: new FormControl<number | null>(null, [
      Validators.min(0),
      Validators.max(30),
      positiveIntegerValidator(),
    ]),
    breed: new FormControl<string | null>(null, [
      Validators.maxLength(100),
      breedValidator(),
    ]),
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

  private isLoadingApiCall = signal(false);
  private isProcessingFiles = signal(false);
  private catSubscription!: Subscription;

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
    this.catSubscription = this.route.data.subscribe({
      next: (data) => {
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
    this.files.set(files);
    this.isProcessingFiles.set(false);
  }

  onFilesError(error: string) {
    this.snackbarService.show(error, "error");
    this.isProcessingFiles.set(false);
  }

  onAgeKeydown(event: KeyboardEvent) {
    const invalidKeys = ["e", "E", "+", "-", "."];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
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
    this.catSubscription.unsubscribe();
  }
}
