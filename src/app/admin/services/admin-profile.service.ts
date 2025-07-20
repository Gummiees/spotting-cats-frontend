import { Injectable } from "@angular/core";
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { LoadingService } from "@shared/services/loading.service";
import { AdminProfileUser } from "@models/admin-profile-user";
import { AdminService, NotFoundException } from "./admin.service";

@Injectable()
export class AdminProfileResolverService
  implements Resolve<AdminProfileUser | null>
{
  constructor(
    private adminService: AdminService,
    private loadingService: LoadingService
  ) {}

  async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const username = route.paramMap.get("username");

    if (!username) {
      throw new Error("Username parameter is required");
    }

    try {
      this.loadingService.setRouteLoading(true);
      const result = await this.adminService.getAdminProfileUser(username);
      return result;
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
