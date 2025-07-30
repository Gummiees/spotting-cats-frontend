import { RouterModule, Routes } from "@angular/router";
import { Admin } from "./views/admin/admin";
import { AdminProfile } from "./views/admin-profile/admin-profile";
import { NgModule } from "@angular/core";
import { AdminProfileResolverService } from "./services/admin-profile.service";
import { NotFound } from "../not-found/not-found";

export const routes: Routes = [
  { path: "", component: Admin },
  {
    path: "user/:username",
    component: AdminProfile,
    resolve: { user: AdminProfileResolverService },
  },
  { path: "**", component: NotFound },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutesModule {}
