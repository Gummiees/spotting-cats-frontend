import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom } from "rxjs";
import { StorageService } from "./storage.service";
import { AuthStateService } from "./auth-state.service";

@Injectable({
  providedIn: "root",
})
export class AdminService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private authStateService: AuthStateService
  ) {}

  async banUser(username: string, reason: string | null): Promise<void> {
    const loggedInUser = this.authStateService.user();
    if (!loggedInUser) {
      throw new UnauthorizedException("User not logged in");
    }
    if (!loggedInUser.isAdmin) {
      this.authStateService.setUnauthenticated();
      this.storageService.clear();
      throw new ForbiddenException("User is not an admin");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/ban`, {
        username,
        reason,
      })
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new ForbiddenException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async unbanUser(username: string): Promise<void> {
    const loggedInUser = this.authStateService.user();
    if (!loggedInUser) {
      throw new UnauthorizedException("User not logged in");
    }
    if (!loggedInUser.isAdmin) {
      this.authStateService.setUnauthenticated();
      this.storageService.clear();
      throw new ForbiddenException("User is not an admin");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/unban`, {
        username,
      })
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new ForbiddenException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }
}

export class AdminServiceException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UnauthorizedException extends AdminServiceException {}

export class ForbiddenException extends AdminServiceException {}
