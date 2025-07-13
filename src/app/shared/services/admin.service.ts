import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom } from "rxjs";
import { StorageService } from "./storage.service";
import { AuthStateService } from "./auth-state.service";
import {
  hasPermissionToBan,
  isAdminOrSuperadmin,
} from "@shared/utils/role-permissions";
import { UserRole } from "@models/user-roles";

@Injectable({
  providedIn: "root",
})
export class AdminService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private authStateService: AuthStateService
  ) {}

  async migrateAvatars(): Promise<void> {
    const user = this.authStateService.user();
    if (!user) {
      throw new Error("User not found");
    }

    if (!isAdminOrSuperadmin(user.role)) {
      throw new Error("User is not admin");
    }

    return firstValueFrom(
      this.http.post<void>(
        `${environment.apiUrl}/v1/users/admin/ensure-avatars`,
        {}
      )
    );
  }

  async banUser(
    username: string,
    reason: string | null,
    role: UserRole
  ): Promise<void> {
    const loggedInUser = this.authStateService.user();
    if (!loggedInUser) {
      throw new UnauthorizedException("User not logged in");
    }
    if (!hasPermissionToBan(loggedInUser.role, role)) {
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

  async unbanUser(username: string, role: UserRole): Promise<void> {
    const loggedInUser = this.authStateService.user();
    if (!loggedInUser) {
      throw new UnauthorizedException("User not logged in");
    }
    if (!hasPermissionToBan(loggedInUser.role, role)) {
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
