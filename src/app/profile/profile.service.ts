import { Injectable } from "@angular/core";
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { ExternalUser } from "@models/external-user";
import { UserService, NotFoundException } from "@shared/services/user.service";
import { LoadingService } from "@shared/services/loading.service";

@Injectable({
  providedIn: "root",
})
export class ProfileResolverService implements Resolve<ExternalUser | null> {
  constructor(
    private userService: UserService,
    private loadingService: LoadingService
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const username = route.paramMap.get("username");
    if (!username) {
      throw new Error("Username parameter is required");
    }

    try {
      this.loadingService.setRouteLoading(true);
      return await this.userService.getUserByUsername(username);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    } finally {
      this.loadingService.setRouteLoading(false);
    }
  }
}
