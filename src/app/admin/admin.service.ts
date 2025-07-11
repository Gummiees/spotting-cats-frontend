import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "@environments/environment";
import { AuthStateService } from "@shared/services/auth-state.service";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AdminService {
  constructor(
    private http: HttpClient,
    private authStateService: AuthStateService
  ) {}

  async migrateAvatars(): Promise<void> {
    const user = this.authStateService.user();
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isAdmin) {
      throw new Error("User is not admin");
    }

    return firstValueFrom(
      this.http.post<void>(
        `${environment.apiUrl}/v1/users/admin/ensure-avatars`,
        {}
      )
    );
  }
}
