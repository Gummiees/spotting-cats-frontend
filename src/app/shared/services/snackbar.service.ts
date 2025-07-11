import { Injectable } from "@angular/core";
import { Snackbar, SnackbarType } from "@shared/components/snackbar/snackbar";

@Injectable({ providedIn: "root" })
export class SnackbarService {
  private snackbarRef?: Snackbar;

  register(snackbar: Snackbar) {
    this.snackbarRef = snackbar;
  }

  show(message: string, duration = 3000, type: SnackbarType = "success") {
    this.snackbarRef?.show(message, duration, type);
  }
}
