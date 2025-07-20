import { Component, input, output } from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { SnackbarService } from "@shared/services/snackbar.service";

@Component({
  selector: "app-notes-form",
  templateUrl: "./notes-form.html",
  standalone: false,
})
export class NotesForm {
  note = input<string | null>(null);
  isLoading = input<boolean>(false);
  onClose = output<void>();
  onSave = output<string>();

  noteControl = new FormControl("", [Validators.required]);

  constructor(private snackbarService: SnackbarService) {}

  onCloseClick() {
    this.onClose.emit();
  }

  onSaveClick() {
    const noteValue = this.noteControl.value;
    if (this.noteControl.invalid || !noteValue) {
      this.snackbarService.show("Please enter a note", "error");
      return;
    }

    this.onSave.emit(noteValue);
  }
}
