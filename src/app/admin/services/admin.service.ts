import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom, map } from "rxjs";
import { AuthStateService } from "../../shared/services/auth-state.service";
import {
  isAdminOrSuperadmin,
  hasPermissionOverUser,
} from "@shared/utils/role-permissions";
import { UserRole } from "@models/user-roles";
import { AdminProfileUser } from "@models/admin-profile-user";

@Injectable()
export class AdminService {
  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService
  ) {}

  async migrateAvatars(): Promise<void> {
    const user = this.authStateService.user();
    if (!user) {
      this.authStateService.setUnauthenticated();
      return;
    }

    if (!isAdminOrSuperadmin(user.role)) {
      this.authStateService.setUnauthenticated();
      return;
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
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/ban`, {
        username,
        reason,
      })
    );
  }

  async unbanUser(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/unban`, {
        username,
      })
    );
  }

  async banIp(
    username: string,
    reason: string | null,
    role: UserRole
  ): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/ban-ip`, {
        username,
        reason,
      })
    );
  }

  async unbanIp(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/unban-ip`, {
        username,
      })
    );
  }

  async cleanup(): Promise<void> {
    const user = this.authStateService.user();
    if (!user) {
      this.authStateService.setUnauthenticated();
      return;
    }

    if (!isAdminOrSuperadmin(user.role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/admin/cleanup`, {})
    ).catch((error) => {
      switch (error.status) {
        case 429:
          throw new RateLimitException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async updateRole(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/role`, {
        username,
        role,
      })
    ).catch((error) => {
      switch (error.status) {
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async demoteToUser(username: string, role: UserRole): Promise<void> {
    if (!this.loggedInUserHasPermissionsOverUser(role)) {
      this.authStateService.setUnauthenticated();
      return;
    }

    return firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/role`, {
        username,
        role: "user",
      })
    ).catch((error) => {
      switch (error.status) {
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async getAdminProfileUser(username: string): Promise<AdminProfileUser> {
    const user = this.authStateService.user();
    if (!user) {
      this.authStateService.setUnauthenticated();
      throw new UnauthorizedException("User not logged in");
    }

    return firstValueFrom(
      this.http
        .get<{ user: AdminProfileUser }>(
          `${environment.apiUrl}/v1/users/admin/${username}`
        )
        .pipe(map((user) => user.user))
    ).catch((error) => {
      switch (error.status) {
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new AdminServiceException(error.error.message);
      }
    });
  }

  async purgeCats() {
    const user = this.authStateService.user();
    if (!user) {
      this.authStateService.setUnauthenticated();
      throw new Error("User not found");
    }

    if (!isAdminOrSuperadmin(user.role)) {
      this.authStateService.setUnauthenticated();
      throw new Error("User is not admin");
    }

    return firstValueFrom(
      this.http.delete<void>(`${environment.apiUrl}/v1/cats/admin/purge`, {})
    );
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
