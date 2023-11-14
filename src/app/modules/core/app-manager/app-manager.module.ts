import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { AppManagerMain } from "./component/main-page.component";
import { TabMenuModule } from "primeng/tabmenu";
import { AppManagerRoutingModule } from "./app-manager.routing.module";
import { AppManagerApplications } from "./component/application/application.component";
import { AppManagerList } from "./component/list/list.component";
import { AppManagerChatAbilities } from "./component/chat-ability/chat-ability.component";
@NgModule({
  imports: [
    CommonModule,
    AppManagerRoutingModule,
    TabMenuModule,
    ButtonModule,
    ConfirmPopupModule,
    //ToastModule,
    //TagModule,
    //KnobModule,
    //FormsModule,
    //TableModule,
    //ContextMenuModule,
    //ConfirmPopupModule,
    //ButtonModule,
    //DialogModule,
    //ReactiveFormsModule,
    //RippleModule,
    //DropdownModule,
    //RadioButtonModule,
    //CheckboxModule,
    //MultiSelectModule,
    //SliderModule,
    //InputSwitchModule,
    //SkillConfigurationModule,
    //InputTextModule,
  ],
  declarations: [
    AppManagerMain,
    AppManagerApplications,
    AppManagerList,
    AppManagerChatAbilities,
  ],
})
export class AppManagerModule {}
