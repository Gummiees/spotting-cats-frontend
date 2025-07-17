import { NgModule } from "@angular/core";
import { Admin } from "./components/admin";
import { RouterModule } from "@angular/router";
import { Header } from "@shared/components/header/header";
import { NotFound } from "../not-found/not-found";
import { CommonModule } from "@angular/common";
import { AdminService } from "src/app/admin/services/admin.service";
import { AdminProfile } from "./views/admin-profile/admin-profile";
import { AdminRoutesModule } from "./admin.routes";
import { Modal } from "@shared/components/modal/modal";
import { Badge } from "@shared/components/badge/badge";
import { ReactiveFormsModule } from "@angular/forms";
import { ModalContentSimple } from "@shared/components/modal-content-simple/modal-content-simple";
import { PrimaryButton } from "@shared/components/primary-button/primary-button";
import { DaysAgoPipe } from "@shared/pipes/days-ago.pipe";
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";
import { AdminProfileResolverService } from "./services/admin-profile.service";
import { Timeline } from "@shared/components/timeline/timeline";

@NgModule({
  declarations: [Admin, AdminProfile],
  imports: [
    CommonModule,
    RouterModule,
    Header,
    NotFound,
    AdminRoutesModule,
    CommonModule,
    Modal,
    Header,
    Badge,
    ReactiveFormsModule,
    ModalContentSimple,
    NotFound,
    PrimaryButton,
    DaysAgoPipe,
    RouterLink,
    DatePipe,
    Timeline,
  ],
  providers: [AdminService, AdminProfileResolverService],
})
export class AdminModule {}
