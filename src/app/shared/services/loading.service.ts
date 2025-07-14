import { Injectable, signal } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LoadingService {
  private _loading = signal(false);
  private _routeLoading = signal(false);

  get loading() {
    return this._loading();
  }

  get routeLoading() {
    return this._routeLoading();
  }

  setLoading(loading: boolean) {
    this._loading.set(loading);
  }

  setRouteLoading(loading: boolean) {
    this._routeLoading.set(loading);
  }
}
