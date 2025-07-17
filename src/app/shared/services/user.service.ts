import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { ExternalUser } from "@models/external-user";
import { OwnUser } from "@models/own-user";
import { firstValueFrom, map, tap } from "rxjs";
import { StorageService } from "./storage.service";
import { AuthStateService } from "./auth-state.service";
import { ForbiddenException } from "./admin.service";

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
        case 403:
          throw new ForbiddenException(error.error.message);
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
      this.http
        .get<{ user: ExternalUser }>(
          `${environment.apiUrl}/v1/users/${username}`
        )
        .pipe(map((response) => response.user))
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
        case 429:
          throw new RateLimitException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });

    await this.authStateService.checkAuthStatus();
  }

  async verifyEmail(code: string): Promise<void> {
    if (!this.authStateService.user()) {
      throw new UserServiceException("User not logged in");
    }

    await firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/users/email/verify`, {
        code,
      })
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidCodeException(error.error.message);
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
      this.http
        .post<void>(`${environment.apiUrl}/v1/users/deactivate`, {})
        .pipe(
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

  async checkUsernameAvailability(username: string): Promise<boolean> {
    return firstValueFrom(
      this.http

        .get<{ available: boolean }>(
          `${environment.apiUrl}/v1/users/check-username`,
          {
            params: { username },
          }
        )
        .pipe(map((response) => response.available))
    ).catch((error) => {
      switch (error.status) {
        case 400:
          throw new InvalidUsernameException(error.error.message);
        default:
          throw new UserServiceException(error.error.message);
      }
    });
  }

  async checkEmailAvailability(email: string): Promise<boolean> {
    return firstValueFrom(
      this.http
        .get<{ available: boolean; statusCode?: string }>(
          `${environment.apiUrl}/v1/users/check-email`,
          {
            params: { email },
          }
        )
        .pipe(
          map((response) => {
            if (response.statusCode === "EMAIL_SAME_AS_CURRENT") {
              throw new EmailSameAsCurrentException(
                "Email is the same as current"
              );
            } else if (response.statusCode === "INVALID_EMAIL_FORMAT") {
              throw new InvalidEmailException("Invalid email format");
            } else if (response.statusCode === "EMAIL_ALREADY_IN_USE") {
              throw new EmailAlreadyTakenException("Email already taken");
            }

            return response.available;
          })
        )
    ).catch((error) => {
      if (error instanceof UserServiceException) {
        throw error;
      }

      switch (error.status) {
        case 400:
          throw new InvalidEmailException(error.error.message);
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

export class EmailSameAsCurrentException extends UserServiceException {}

export class EmailAlreadyTakenException extends UserServiceException {}

export class InvalidUsernameException extends UserServiceException {}

export class InvalidAvatarException extends UserServiceException {}

export class InvalidCodeException extends UserServiceException {}

export class RateLimitException extends UserServiceException {}

export class UnauthorizedException extends UserServiceException {}

export class NotFoundException extends UserServiceException {}
