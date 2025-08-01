import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Cat } from "@models/cat";
import { AuthStateService } from "@shared/services/auth-state.service";
import { SnackbarService } from "@shared/services/snackbar.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-cat-form",
  templateUrl: "./cat-form.html",
  standalone: false,
})
export class CatForm implements OnChanges, OnDestroy {
  cat = input<Cat | null>(null);
  isLoading = input<boolean>(false);
  onClose = output<void>();
  onSave = output<Cat>();
  private catSubscription!: Subscription;

  catForm = new FormGroup({
    name: new FormControl("", [Validators.required]),
    imageUrls: new FormControl<string[]>(
      [],
      [Validators.required, Validators.minLength(1)]
    ),
    xCoordinate: new FormControl<number>(0, [Validators.required]),
    yCoordinate: new FormControl<number>(0, [Validators.required]),
    age: new FormControl<number>(0),
    breed: new FormControl(null),
    extraInfo: new FormControl(null),
    isDomestic: new FormControl<boolean>(false),
    isMale: new FormControl<boolean>(false),
    isSterilized: new FormControl<boolean>(false),
    isFriendly: new FormControl<boolean>(false),
    confirmedOwnerAt: new FormControl(null),
    userId: new FormControl(null),
    protectorId: new FormControl(null),
    colonyId: new FormControl(null),
    isUserOwner: new FormControl(false),
  });

  constructor(
    private snackbarService: SnackbarService,
    private authStateService: AuthStateService
  ) {}

  private get user() {
    return this.authStateService.user();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const catChange = changes["cat"];
    if (catChange && !catChange.firstChange) {
      const currentValue = catChange.currentValue;
      const previousValue = catChange.previousValue;

      if (currentValue !== previousValue) {
        this.catForm.setValue(currentValue, { emitEvent: false });
        this.catForm.updateValueAndValidity();
        if (!currentValue) {
          this.catForm.markAsPristine();
          this.catForm.markAsUntouched();
        } else {
          this.catForm.markAsDirty();
          this.catForm.markAsTouched();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.catSubscription.unsubscribe();
  }

  onCloseClick() {
    this.onClose.emit();
  }

  onSaveClick() {
    const user = this.user;
    if (!user) {
      this.snackbarService.show("Please login to save a cat", "error");
      return;
    }

    if (this.catForm.invalid) {
      this.snackbarService.show("Please fill in all fields", "error");
      return;
    }

    const catValue: Cat = {
      ...this.catForm.value,
      id: this.cat()?.id ?? "",
      name: this.cat()?.name ?? this.catForm.value.name!,
      totalLikes: this.cat()?.totalLikes ?? 0,
      isLiked: this.cat()?.isLiked ?? false,
      isUserOwner: this.cat()?.isUserOwner ?? false,
      createdAt: this.cat()?.createdAt ?? new Date(),
      imageUrls: this.cat()?.imageUrls ?? this.catForm.value.imageUrls ?? [],
      xCoordinate:
        this.cat()?.xCoordinate ?? this.catForm.value.xCoordinate ?? 0,
      yCoordinate:
        this.cat()?.yCoordinate ?? this.catForm.value.yCoordinate ?? 0,
      extraInfo:
        this.cat()?.extraInfo ?? this.catForm.value.extraInfo ?? undefined,
      isDomestic:
        this.cat()?.isDomestic ?? this.catForm.value.isDomestic ?? undefined,
      isMale: this.cat()?.isMale ?? this.catForm.value.isMale ?? undefined,
      isSterilized:
        this.cat()?.isSterilized ??
        this.catForm.value.isSterilized ??
        undefined,
      isFriendly:
        this.cat()?.isFriendly ?? this.catForm.value.isFriendly ?? undefined,
      confirmedOwnerAt: this.cat()?.confirmedOwnerAt,
      updatedAt: this.cat()?.updatedAt,
      username: this.cat()?.username ?? user.username,
      protectorId: this.cat()?.protectorId,
      colonyId: this.cat()?.colonyId,
      age: this.cat()?.age ?? this.catForm.value.age ?? undefined,
      breed: this.cat()?.breed ?? this.catForm.value.breed ?? undefined,
    };
    if (this.catForm.invalid || !catValue) {
      this.snackbarService.show("Please enter a cat", "error");
      return;
    }

    this.onSave.emit(catValue);
  }
}
