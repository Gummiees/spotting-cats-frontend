import { RouterModule, Routes } from "@angular/router";
import { Admin } from "./components/admin";
import { AdminProfile } from "./views/admin-profile/admin-profile";
import { NgModule } from "@angular/core";
import { AdminProfileResolverService } from "./services/admin-profile.service";

export const routes: Routes = [
  { path: "", component: Admin },
  {
    path: "user/:username",
    component: AdminProfile,
    resolve: { user: AdminProfileResolverService },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutesModule {}
