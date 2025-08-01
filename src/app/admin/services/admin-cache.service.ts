import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { firstValueFrom } from "rxjs";
import { AuthStateService } from "../../shared/services/auth-state.service";
import { StorageService } from "@shared/services/storage.service";

@Injectable()
export class AdminCacheService {
  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService,
    private storageService: StorageService
  ) {}

  async flushCache(): Promise<void> {
    const user = this.authStateService.user();
    if (!user) {
      this.onForbiddenRequest();
      throw new Error("User not found");
    }

    if (user.role !== "superadmin") {
      this.onForbiddenRequest();
      throw new Error("User is not admin");
    }

    return firstValueFrom(
      this.http.post<void>(`${environment.apiUrl}/v1/cache/flush`, {})
    );
  }

  private onForbiddenRequest() {
    this.authStateService.setUnauthenticated();
    this.storageService.clear();
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
