import { Injectable } from "@angular/core";
import {
  Resolve,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { ExternalUser } from "@models/external-user";
import { UserService } from "@shared/services/user.service";

@Injectable({
  providedIn: "root",
})
export class ProfileResolverService implements Resolve<ExternalUser> {
  constructor(private userService: UserService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const username = route.paramMap.get("username");
    if (!username) {
      throw new Error("Username parameter is required");
    }
    return this.userService.getUserByUsername(username);
  }
}
