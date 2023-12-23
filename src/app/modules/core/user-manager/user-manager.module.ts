import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { UserManagerMain } from "./component/main-page.component";
import { TabMenuModule } from "primeng/tabmenu";
import { UserManagerRoutingModule } from "./user-manager.routing.module";
import { UserManagerList } from "./component/list/list.component";
import { TableModule } from "primeng/table";
import { ToastModule } from "primeng/toast";
import { UserManagerGroups } from "./component/groups/groups.component";
import { CheckboxModule } from "primeng/checkbox";
import { FormsModule } from "@angular/forms";
import { FieldsetModule } from "primeng/fieldset";
import { InputSwitchModule } from "primeng/inputswitch";

@NgModule({
  imports: [
    CommonModule,
    UserManagerRoutingModule,
    TabMenuModule,
    ButtonModule,
    ConfirmPopupModule,
    ToastModule,
    FieldsetModule,
    FormsModule,
    TableModule,
    InputSwitchModule,
    ButtonModule,
    CheckboxModule,
  ],
  declarations: [UserManagerMain, UserManagerList, UserManagerGroups],
})
export class UserManagerModule {}
