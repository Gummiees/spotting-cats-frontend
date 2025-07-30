import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { SnackbarService } from "@shared/services/snackbar.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-notes-form",
  templateUrl: "./notes-form.html",
  standalone: false,
})
export class NotesForm implements OnInit, OnChanges, OnDestroy {
  note = input<string | null>(null);
  noteChange = output<string | null>();
  isLoading = input<boolean>(false);
  onClose = output<void>();
  onSave = output<string>();
  private noteSubscription!: Subscription;

  noteControl = new FormControl("", [Validators.required]);

  constructor(private snackbarService: SnackbarService) {}

  ngOnInit(): void {
    this.noteSubscription = this.noteControl.valueChanges.subscribe((val) => {
      this.noteChange.emit(val);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const noteChange = changes["note"];
    if (noteChange && !noteChange.firstChange) {
      const currentValue = noteChange.currentValue;
      const previousValue = noteChange.previousValue;

      if (currentValue !== previousValue) {
        this.noteControl.setValue(currentValue, { emitEvent: false });
        this.noteControl.updateValueAndValidity();
        if (!currentValue) {
          this.noteControl.markAsPristine();
          this.noteControl.markAsUntouched();
        } else {
          this.noteControl.markAsDirty();
          this.noteControl.markAsTouched();
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.noteSubscription.unsubscribe();
  }

  onCloseClick() {
    this.onClose.emit();
  }

  onSaveClick() {
    const noteValue = this.noteControl.value;
    if (this.noteControl.invalid || !noteValue) {
      this.snackbarService.show("Please enter a note", "error");
      return;
    }

    this.noteChange.emit(noteValue);
    this.onSave.emit(noteValue);
  }
}
