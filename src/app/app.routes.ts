import { Routes } from "@angular/router";
import { AuthGuard } from "@shared/guards/auth.guard";
import { AdminGuard } from "@shared/guards/admin.guard";
import { CatsComponent } from "./cats/cats";
import { Settings } from "./settings/settings";
import { NotFound } from "./not-found/not-found";
import { Profile } from "./profile/profile";
import { ProfileResolverService } from "./profile/profile-resolver.service";
import { CatProfile } from "./cat-profile/cat-profile";
import { CatProfileResolverService } from "@shared/services/cat-profile-resolver.service";

export const routes: Routes = [
  { path: "", redirectTo: "/cats", pathMatch: "full" },
  { path: "cats", component: CatsComponent },
  {
    path: "cat/:id",
    component: CatProfile,
    resolve: { cat: CatProfileResolverService },
  },
  {
    path: "admin",
    loadChildren: () =>
      import("./admin/admin.module").then((m) => m.AdminModule),
    canActivate: [AdminGuard],
  },
  { path: "settings", component: Settings, canActivate: [AuthGuard] },
  {
    path: "user/:username",
    component: Profile,
    resolve: { user: ProfileResolverService },
  },
  { path: "**", component: NotFound },
];
