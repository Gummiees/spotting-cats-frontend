import { Injectable } from "@angular/core";
import { Snackbar, SnackbarType } from "@shared/components/snackbar/snackbar";

@Injectable({ providedIn: "root" })
export class SnackbarService {
  private snackbarRef?: Snackbar;

  register(snackbar: Snackbar) {
    this.snackbarRef = snackbar;
  }

  show(message: string, type: SnackbarType = "success", duration = 3000) {
    this.snackbarRef?.show(message, type, duration);
  }
}
