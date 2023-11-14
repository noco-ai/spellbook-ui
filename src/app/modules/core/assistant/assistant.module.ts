import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ChatAppRoutingModule } from "./assistant-routing.module";
import { ChatAppComponent } from "./component/assistant.component";
import { ChatSidebarComponent } from "./component/chat-sidebar/chat-sidebar.component";
import { AvatarModule } from "primeng/avatar";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { OverlayPanelModule } from "primeng/overlaypanel";
import { BadgeModule } from "primeng/badge";
import { ChatBoxComponent } from "./component/chat-box/chat-box.component";
import { AssistantService } from "./service/assistant.service";
import { RippleModule } from "primeng/ripple";
import { SidebarModule } from "primeng/sidebar";
import { ConfirmPopupModule } from "primeng/confirmpopup";
import { DialogModule } from "primeng/dialog";
import { AvatarGroupModule } from "primeng/avatargroup";
import { ProgressBarModule } from "primeng/progressbar";
import { SliderModule } from "primeng/slider";
import { DropdownModule } from "primeng/dropdown";
import { KeyFilterModule } from "primeng/keyfilter";
import { MultiSelectModule } from "primeng/multiselect";
import { UploadedFilesComponent } from "./component/uploaded-files/uploaded-files.component";
import { ToastModule } from "primeng/toast";
import { MessageService } from "primeng/api";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ChatAppRoutingModule,
    AvatarModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    BadgeModule,
    MultiSelectModule,
    OverlayPanelModule,
    RippleModule,
    SidebarModule,
    ConfirmPopupModule,
    DialogModule,
    AvatarGroupModule,
    ProgressBarModule,
    SliderModule,
    KeyFilterModule,
    ToastModule,
  ],
  declarations: [
    ChatSidebarComponent,
    ChatAppComponent,
    ChatBoxComponent,
    UploadedFilesComponent,
  ],
  providers: [AssistantService, MessageService],
})
export class AssistantModule {}
