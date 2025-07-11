import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private _loading = signal(false);

  set loading(loading: boolean) {
    this._loading.set(loading);
  }

  get loading() {
    return this._loading();
  }
}
