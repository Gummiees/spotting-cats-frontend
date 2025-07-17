import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom, map } from "rxjs";
import { StorageService } from "./storage.service";
import { AuthStateService } from "./auth-state.service";
import {
  isAdminOrSuperadmin,
  hasPermissionOverUser,
} from "@shared/utils/role-permissions";
import { UserRole } from "@models/user-roles";
import { ExternalUser } from "@models/external-user";

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
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async banUser(
    username: string,
    reason: string | null,
    role: UserRole
  ): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.onForbiddenRequest();
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
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async unbanUser(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.onForbiddenRequest();
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

  async banIp(
    username: string,
    reason: string | null,
    role: UserRole
  ): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.onForbiddenRequest();
      throw new ForbiddenException("User is not an admin");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/ban-ip`, {
        username,
        reason,
      })
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async unbanIp(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.onForbiddenRequest();
      throw new ForbiddenException("User is not an admin");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/unban-ip`, {
        username,
      })
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async cleanup(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/admin/cleanup`, {})
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        case 429:
          throw new RateLimitException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async updateRole(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.onForbiddenRequest();
      throw new ForbiddenException("User is not an admin");
    }

    return firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/role`, {
        username,
        role,
      })
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async demoteToUser(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.onForbiddenRequest();
      throw new ForbiddenException("User is not an admin");
    }

    return firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/role`, {
        username,
        role: "user",
      })
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async getUserByUserId(id: string): Promise<ExternalUser> {
    return firstValueFrom(
      this.http
        .get<{ user: ExternalUser }>(
          `${environment.apiUrl}/v1/users/admin/users/id/${id}`
        )
        .pipe(map((user) => user.user))
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        case 403:
          this.onForbiddenRequest();
          throw new ForbiddenException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  private onForbiddenRequest() {
    this.authStateService.setUnauthenticated();
    this.storageService.clear();
  }

  private loggedInUserHasPermissionsOverUser(role: UserRole): boolean {
    const loggedInUser = this.authStateService.user();
    if (!loggedInUser) {
      throw new UnauthorizedException("User not logged in");
    }
    return hasPermissionOverUser({
      loggedInUserRole: loggedInUser.role,
      userRole: role,
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

export class RateLimitException extends AdminServiceException {}

export class NotFoundException extends AdminServiceException {}
