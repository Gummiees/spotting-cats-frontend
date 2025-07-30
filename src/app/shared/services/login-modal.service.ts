import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LoginModalService {
  private _isOpen = signal(false);

  get isOpen() {
    return this._isOpen.asReadonly();
  }

  openModal() {
    this._isOpen.set(true);
  }

  closeModal() {
    this._isOpen.set(false);
  }
}
