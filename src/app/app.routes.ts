import { Routes } from "@angular/router";
import { AuthGuard } from "@shared/guards/auth.guard";
import { AdminGuard } from "@shared/guards/admin.guard";
import { CatsComponent } from "./cats/cats";
import { NotFound } from "./not-found/not-found";
import { ProfileResolverService } from "./profile/profile-resolver.service";
import { CatProfileResolverService } from "@shared/services/cat-profile-resolver.service";

export const routes: Routes = [
  { path: "", redirectTo: "/cats", pathMatch: "full" },
  { path: "cats", component: CatsComponent },
  {
    path: "cat/:id",
    loadComponent: () =>
      import("./cat-profile/cat-profile").then((m) => m.CatProfile),
    resolve: { data: CatProfileResolverService },
  },
  {
    path: "admin",
    loadChildren: () =>
      import("./admin/admin.module").then((m) => m.AdminModule),
    canActivate: [AdminGuard],
  },
  {
    path: "settings",
    loadComponent: () => import("./settings/settings").then((m) => m.Settings),
    canActivate: [AuthGuard],
  },
  {
    path: "user/:username",
    loadComponent: () => import("./profile/profile").then((m) => m.Profile),
    resolve: { user: ProfileResolverService },
  },
  { path: "**", component: NotFound },
];
