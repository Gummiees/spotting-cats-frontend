import { Routes } from "@angular/router";
import { AuthGuard } from "@shared/guards/auth.guard";
import { AdminGuard } from "@shared/guards/admin.guard";
import { Admin } from "./admin/admin";
import { CatsComponent } from "./cats/component/cats.component";
import { Settings } from "./settings/settings";
import { NotFound } from "./not-found/not-found";
import { Profile } from "./profile/profile";
import { ProfileResolverService } from "./profile/profile.service";

export const routes: Routes = [
  { path: "", redirectTo: "/cats", pathMatch: "full" },
  { path: "cats", component: CatsComponent },
  { path: "admin", component: Admin, canActivate: [AdminGuard] },
  { path: "settings", component: Settings, canActivate: [AuthGuard] },
  { path: "**", component: NotFound },
  {
    path: "user/:username",
    component: Profile,
    resolve: { user: ProfileResolverService },
  },
];
