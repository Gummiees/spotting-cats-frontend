import { Routes } from "@angular/router";
import { AuthGuard } from "@shared/guards/auth.guard";
import { AdminGuard } from "@shared/guards/admin.guard";
import { AnonymousGuard } from "@shared/guards/anonymous.guard";
import { Profile } from "./profile/profile";
import { Login } from "./login/login";
import { VerifyCode } from "./verify-code/verify-code";
import { Admin } from "./admin/admin";
import { CatsComponent } from "./cats/component/cats.component";
import { Logout } from "./logout/logout";
import { Settings } from "./settings/settings";

export const routes: Routes = [
  { path: "cats", component: CatsComponent },
  { path: "login", component: Login, canActivate: [AnonymousGuard] },
  {
    path: "verify-code",
    component: VerifyCode,
    canActivate: [AnonymousGuard],
  },
  { path: "profile", component: Profile, canActivate: [AuthGuard] },
  { path: "admin", component: Admin, canActivate: [AdminGuard] },
  { path: "logout", component: Logout, canActivate: [AuthGuard] },
  { path: "settings", component: Settings, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "/cats" },
];
