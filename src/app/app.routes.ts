import { Routes } from "@angular/router";
import { AuthGuard } from "@shared/guards/auth.guard";
import { AdminGuard } from "@shared/guards/admin.guard";
import { AnonymousGuard } from "@shared/guards/anonymous.guard";
import { Login } from "./login/login";
import { VerifyCode } from "./verify-code/verify-code";
import { Admin } from "./admin/admin";
import { CatsComponent } from "./cats/component/cats.component";
import { Settings } from "./settings/settings";

export const routes: Routes = [
  { path: "", redirectTo: "/cats", pathMatch: "full" },
  { path: "cats", component: CatsComponent },
  { path: "login", component: Login, canActivate: [AnonymousGuard] },
  {
    path: "verify-code",
    component: VerifyCode,
    canActivate: [AnonymousGuard],
  },
  { path: "admin", component: Admin, canActivate: [AdminGuard] },
  { path: "settings", component: Settings, canActivate: [AuthGuard] },
  { path: "**", redirectTo: "/cats" },
];
