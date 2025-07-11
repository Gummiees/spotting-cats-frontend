import { HttpClient } from "@angular/common/http";
import { Injectable, signal } from "@angular/core";
import { environment } from "@environments/environment";
import { ExternalUser } from "@models/external-user";
import { OwnUser } from "@models/own-user";
import { firstValueFrom, tap } from "rxjs";
import { StorageService } from "./storage.service";
import { AuthStateService } from "./auth-state.service";

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private authStateService: AuthStateService
  ) {}

  async sendCode(email: string): Promise<void> {
    if (this.authStateService.user()) {
      throw new UserServiceException("User already logged in");
    }

    return firstValueFrom(
      this.http
        .post<void>(`${environment.apiUrl}/v1/users/send-code`, {
          email,
        })
        .pipe(tap((_) => this.storageService.setItem("email", email)))
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidEmailException(error.error.message);
        case 429:
          throw new RateLimitException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async verifyCode(code: string): Promise<ValidateCodeSuccessResponse> {
    if (this.authStateService.user()) {
      throw new UserServiceException("User already logged in");
    }

    const email = this.storageService.getItem("email");
    if (!email) {
      throw new UserServiceException("Email not found");
    }

    return firstValueFrom(
      this.http
        .post<ValidateCodeSuccessResponse>(
          `${environment.apiUrl}/v1/users/verify-code`,
          {
            email,
            code,
          }
        )
        .pipe(
          tap((response) => {
            this.storageService.removeItem("email");
            this.authStateService.setAuthenticated(response.user);
          })
        )
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidEmailException(error.error.message);
        case 429:
          throw new RateLimitException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async logout(): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/logout`, {}).pipe(
        tap(() => {
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
        })
      )
    ).catch((error) => {
      switch (error.status) {
        case 401:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new UnauthorizedException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async getProfile(): Promise<OwnUser> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    return firstValueFrom(
      this.http.get<OwnUser>(`${environment.apiUrl}/v1/users/profile`)
    ).catch((error) => {
      switch (error.status) {
        case 401:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new UnauthorizedException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async getUserByUsername(username: string): Promise<ExternalUser> {
    return firstValueFrom(
      this.http.get<ExternalUser>(`${environment.apiUrl}/v1/users/${username}`)
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidUsernameException(error.error.message);
        case 404:
          throw new NotFoundException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async updateUsername(username: string): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    await firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/username`, {
        username,
      })
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidUsernameException(error.error.message);
        case 401:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new UnauthorizedException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });

    await this.authStateService.checkAuthStatus();
  }

  async updateEmail(email: string): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    await firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/email`, {
        email,
      })
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidEmailException(error.error.message);
        case 401:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new UnauthorizedException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });

    await this.authStateService.checkAuthStatus();
  }

  async updateAvatar(avatarUrl: string): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    await firstValueFrom(
      this.http.put<void>(`${environment.apiUrl}/v1/users/avatar`, {
        avatarUrl,
      })
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidAvatarException(error.error.message);
        case 401:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new UnauthorizedException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });

    await this.authStateService.checkAuthStatus();
  }

  async deactivate(): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/users/deactivate`, {}).pipe(
        tap(() => {
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
        })
      )
    ).catch((error) => {
      switch (error.status) {
        case 401:
          throw new UnauthorizedException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async delete(): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    return firstValueFrom(
      this.http.delete<void>(`${environment.apiUrl}/v1/users/delete`, {}).pipe(
        tap(() => {
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
        })
      )
    ).catch((error) => {
      switch (error.status) {
        case 401:
          this.authStateService.setUnauthenticated();
          this.storageService.clear();
          throw new UnauthorizedException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }
}

interface ValidateCodeSuccessResponse {
  user: OwnUser;
}

export class UserServiceException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidEmailException extends UserServiceException {}

export class InvalidUsernameException extends UserServiceException {}

export class InvalidAvatarException extends UserServiceException {}

export class RateLimitException extends UserServiceException {}

export class UnauthorizedException extends UserServiceException {}

export class NotFoundException extends UserServiceException {}
