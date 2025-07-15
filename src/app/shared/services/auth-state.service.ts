import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";
import { OwnUser } from "@models/own-user";
import { firstValueFrom, map } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AuthStateService {
  private _isAuthenticated = signal<boolean>(false);
  private _user = signal<OwnUser | null>(null);
  private _isLoading = signal<boolean>(false);
  private _initialAuthCheck: Promise<boolean> | null = null;

  constructor(private http: HttpClient) {
    // Check authentication status on service initialization
    this._initialAuthCheck = this.checkAuthStatus();
  }

  get isAuthenticated() {
    return this._isAuthenticated.asReadonly();
  }

  get user() {
    return this._user.asReadonly();
  }

  get isLoading() {
    return this._isLoading.asReadonly();
  }

  get initialAuthCheck() {
    return this._initialAuthCheck;
  }

  async checkAuthStatus(): Promise<boolean> {
    this._isLoading.set(true);

    try {
      debugger;
      const user = await firstValueFrom(
        this.http
          .get<{ user: OwnUser }>(`${environment.apiUrl}/v1/users/profile`)
          .pipe(map((response) => response.user))
      );

      this._user.set(user);
      this._isAuthenticated.set(true);
      return true;
    } catch (error: any) {
      this._user.set(null);
      this._isAuthenticated.set(false);
      return false;
    } finally {
      this._isLoading.set(false);
    }
  }

  setAuthenticated(user: OwnUser) {
    this._user.set(user);
    this._isAuthenticated.set(true);
  }

  setUnauthenticated() {
    this._user.set(null);
    this._isAuthenticated.set(false);
  }
}
